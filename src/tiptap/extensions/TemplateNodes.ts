import {
  Extension,
  mergeAttributes,
  JSONContent,
} from '@tiptap/core'
import {
  CreateAttributeOptions,
  createAttribute,
} from '@/tiptap/helpers/createAttribute'

export type CloneTemplateValue<T> = (
  source: T,
  options?: TemplateNodesOptions,
  depth?: number
) => T;

export interface JSONCloningMap {
  content: CloneTemplateValue<JSONContent>;
}

export interface TemplateNodesOptions {
  types: string[];
  markerAttribute?: Partial<CreateAttributeOptions<unknown>>;
  cloneJSON: CloneTemplateValue<JSONContent>;
  cloningMap: Record<string, CloneTemplateValue<unknown>>;
  cloneValue: CloneTemplateValue<unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    templateNodes: {
      /**
       * Enforces use of value node attributes.
       */
      insertFromTemplate: (
        pos: number,
        template: JSONContent,
      ) => ReturnType,
      /**
       * Enforces use of value node attributes.
       */
      setNodeAsTemplate: (
        pos: number,
        value: unknown,
      ) => ReturnType,
    }
  }
}

export const TemplateNodes = Extension.create<TemplateNodesOptions>({
  name: 'templateNodes',

  addOptions() {
    return {
      types: [],
      cloneJSON: (source, options?, depth = 0) => {
        const results: JSONContent = {};
        if(typeof source === 'object' && source && options) {
          const sourceMap = source as Record<string, unknown>;
          const contentDepth = depth + 1;
          for(const key in sourceMap) {
            const callback = options.cloningMap[key] || options.cloneValue;
            results[key] = callback(sourceMap[key], options, contentDepth);
          }
        }
        return results;
      },
      cloningMap: {
        attrs: (source, options?) => {
          if(typeof source === 'object' && source) {
            const results = { ...source } as Record<string, unknown>;
            if(options?.markerAttribute) {
              const key = options.markerAttribute.name;
              if(key && results[key] !== undefined) {
                delete results[key];
              }
            }
            return results;
          }
          return {};
        },
        content: (source, options?, depth?) => {
          if(options && Array.isArray(source)) {
            return source.map(item => options.cloneJSON(
              item as JSONContent,
              options,
              depth,
            ));
          }
          return [];
        },
      },
      cloneValue: source => source,
    }
  },

  addGlobalAttributes() {
    if(this.options.markerAttribute?.name) {
      const attributeName = this.options.markerAttribute?.name;
      return [
        {
          types: this.options.types,
          attributes: {
            [attributeName]: createAttribute(this.options.markerAttribute),
          }
        }
      ];
    }
    return [];
  },

  addCommands() {
    return {
      insertFromTemplate: (
        pos: number,
        template: JSONContent,
      ) => ({ commands }) => {
        const content = this.options.cloneJSON(template, this.options);
        return commands.insertContentAt(pos, content);
      },
      setNodeAsTemplate: (
        pos: number,
        value: unknown,
      ) => ({ tr }) => {
        const node = tr.doc.nodeAt(pos);
        if(this.options.markerAttribute?.name) {
          const attributeName = this.options.markerAttribute.name;
          tr.setNodeAttribute(pos, attributeName, value);
          return node?.attrs[attributeName] === value;
        }
        if(typeof value === 'object' && value) {
          const updatedAttributes = node?.attrs
            ? mergeAttributes(node.attrs, value)
            : { ...value };
          tr.setNodeMarkup(pos, null, updatedAttributes);
        }
        return true;
      },
    };
  },
});
