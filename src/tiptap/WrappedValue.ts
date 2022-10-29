import {
  Mark,
  mergeAttributes,
  JSONContent,
} from '@tiptap/core'

export type WrappedValueTypes = 'string' | 'number' | 'object';

export interface WrappedValueAttributes {
  name: string;
  type: WrappedValueTypes;
}

export interface WrappedValueOptions {
  HTMLAttributes: Record<string, unknown>,
}

export const attributeAliases = {
  name: 'data-value-name',
  type: 'data-value-type',
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wrappedValue: {
      /**
       * Set a link mark
       */
      setWrappedValue: (attributes: Partial<WrappedValueAttributes>) => ReturnType,
      /**
       * Toggle a link mark
       */
      toggleWrappedValue: (attributes: Partial<WrappedValueAttributes>) => ReturnType,
      /**
       * Unset a link mark
       */
      unsetWrappedValue: () => ReturnType,
    }
  }
}

export const WrappedValue = Mark.create<WrappedValueOptions>({
  name: 'wrappedValue',

  priority: 1000,

  keepOnSplit: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      name: {
        default: '',
        parseHTML: element => element.getAttribute(attributeAliases.name),
        renderHTML: attributes => {
          const resolved: Record<string, string> = {};
          if(attributes.name) {
            resolved[attributeAliases.name] = attributes.name;
          }
          return resolved;
        },
      },
      type: {
        default: 'string',
        parseHTML: element => element.getAttribute(attributeAliases.type),
        renderHTML: attributes => {
          const resolved: Record<string, string> = {};
          if(attributes.type) {
            resolved[attributeAliases.type] = attributes.type;
          }
          return resolved;
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `span[data-value-type]`,
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setWrappedValue: attributes => ({ chain }) => {
        return chain()
          .setMark(this.name, attributes)
          .run()
      },
      toggleWrappedValue: attributes => ({ chain }) => {
        return chain()
          .toggleMark(this.name, attributes)
          .run()
      },
      unsetWrappedValue: () => ({ chain }) => {
        return chain()
          .unsetMark(this.name)
          .run()
      },
    }
  },

})

export function findJSONValue(
  source: JSONContent[],
  path: string[]
): JSONContent | null {
  if(path.length) {
    for(const item of source) {
      if(item.marks) {
        const matchedMark = item.marks.find(
          mark => mark.type === 'wrappedValue'
            && mark.attrs?.name === path[0]
        );
        if(matchedMark) {
          if(path.length === 1) {
            return item;
          }
          if(item.content) {
            const subpath = path.slice(1);
            return findJSONValue(item.content, subpath);
          }
        }
      }
      if(item.content) {
        return findJSONValue(item.content, path);
      }
    }
  }
  return null;
}

export function parseJSONValue(source: JSONContent): unknown {
  const rawValue = source.text;
  let valueType = 'string';
  if(source.marks) {
    const matchedMark = source.marks.find(
      mark => mark.type === 'wrappedValue'
        && mark.attrs?.type
    );
    if(matchedMark) {
      valueType = matchedMark.attrs?.type;
    }
  }
  switch(valueType) {
    case 'number':
      return Number(rawValue);
    case 'object':
      return buildValueTree(source);
  }
  return rawValue;
}

export function buildValueTree(
  source: JSONContent,
  destination: Record<string, unknown> = {}
): Record<string, unknown> {
  if(source.content) {
    for(const item of source.content) {
      if(item.marks) {
        const matchedMark = item.marks.find(
          mark => mark.type === 'wrappedValue'
        );
        if(matchedMark) {
          const propertyName = matchedMark.attrs?.name;
          if(propertyName) {
            destination[propertyName] = parseJSONValue(item);
          }
          continue;
        }
      }
      buildValueTree(item, destination);
    }
  }
  return destination;
}
