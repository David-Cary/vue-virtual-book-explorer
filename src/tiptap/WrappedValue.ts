import {
  Mark,
  mergeAttributes,
  JSONContent,
} from '@tiptap/core'
import { Node } from 'prosemirror-model'

export type WrappedValueTypes = 'string' | 'number' | 'object';

export interface WrappedValueAttributes {
  name: string;
  type: WrappedValueTypes;
}

export interface WrappedValueOptions {
  HTMLAttributes: Record<string, unknown>,
}

function renderAliasedAttribute(key: string, value: unknown) {
  const resolved: Record<string, unknown> = {};
  if(value != undefined) {
    resolved[key] = value;
  }
  return resolved;
}

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
        parseHTML: element => element.getAttribute('data-value-name'),
        renderHTML: attributes => renderAliasedAttribute(
          'data-value-name',
          attributes.name
        ),
      },
      type: {
        default: 'string',
        parseHTML: element => element.getAttribute('data-value-type'),
        renderHTML: attributes => renderAliasedAttribute(
          'data-value-type',
          attributes.type
        ),
      },
      value: {
        default: undefined,
        parseHTML: element => element.getAttribute('data-value'),
        renderHTML: attributes => renderAliasedAttribute(
          'data-value',
          attributes.value
        ),
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

export function findWrappedValue(
  source: Node,
  path: string[],
): Node | null {
  if(path.length) {
    for(let i = 0; i < source.childCount; i++) {
      const node = source.child(i);
      if(node.marks) {
        const matchedMark = node.marks.find(
          mark => mark.type.name === 'wrappedValue'
            && mark.attrs?.name === path[0]
        );
        if(matchedMark) {
          const subpath = path.slice(1);
          return findWrappedValue(node, subpath);
        }
      }
      const contentMatch = findWrappedValue(node, path);
      if(contentMatch) {
        return contentMatch;
      }
    }
    return null;
  }
  return source;
}

export function parseWrappedValue(source: Node): unknown {
  let valueType = 'string';
  if(source.marks) {
    const matchedMark = source.marks.find(
      mark => mark.type.name === 'wrappedValue'
        && mark.attrs?.type
    );
    if(matchedMark) {
      if(matchedMark.attrs.value !== undefined) {
        return matchedMark.attrs.value;
      }
      valueType = matchedMark.attrs?.type;
    }
  }
  switch(valueType) {
    case 'number':
      return Number(source.text);
    case 'object':
      return buildWrappedValueObject(source);
    default:
      return source.text;
  }
}

export function buildWrappedValueObject(
  source: Node,
  destination: Record<string, unknown> = {}
): Record<string, unknown> {
  source.descendants(node => {
    const matchedMark = node.marks.find(
      mark => mark.type.name === 'wrappedValue'
    );
    if(matchedMark) {
      const propertyName = matchedMark.attrs?.name;
      if(propertyName) {
        destination[propertyName] = parseWrappedValue(node);
        return false;
      }
    }
  });
  return destination;
}

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
