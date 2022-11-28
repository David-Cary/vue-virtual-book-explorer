import {
  Extension,
  mergeAttributes,
  JSONContent,
  GlobalAttributes,
  findParentNodeClosestToPos,
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
  contentTypes: string[];
  contentAttribute?: Partial<CreateAttributeOptions<unknown>>;
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
      /**
       * Sets a node as the contentDom for it's containing template.
       */
      setTemplateContent: (pos: number, value: unknown) => ReturnType,
    }
  }
}

export const TemplateNodes = Extension.create<TemplateNodesOptions>({
  name: 'templateNodes',

  addOptions() {
    return {
      types: [],
      contentTypes: [],
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
    const rules: GlobalAttributes = [];
    if(this.options.markerAttribute?.name) {
      const attributeName = this.options.markerAttribute.name;
      rules.push({
        types: this.options.types,
        attributes: {
          [attributeName]: createAttribute(this.options.markerAttribute),
        }
      });
    }
    if(this.options.contentAttribute?.name) {
      const attributeName = this.options.contentAttribute.name;
      rules.push({
        types: this.options.types,
        attributes: {
          [attributeName]: createAttribute(this.options.contentAttribute),
        }
      });
    }
    return rules;
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
          // Becoming a template removes template content status.
          if(this.options.contentAttribute?.name) {
            const contentName = this.options.contentAttribute.name;
            tr.setNodeAttribute(pos, contentName, undefined);
          }
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
      setTemplateContent: (pos: number, value: unknown) => ({ tr }) => {
        const markerAttribute = this.options.markerAttribute?.name;
        const contentAttribute = this.options.contentAttribute?.name;
        if(markerAttribute && contentAttribute) {
          const resolved = tr.doc.resolve(pos);
          const template = findParentNodeClosestToPos(
            resolved,
            node => node.attrs[markerAttribute] !== undefined,
          )
          if(template) {
            // Wipe previous content area.
            template.node.descendants((node, nodePos) => {
              if(node.attrs[contentAttribute] !== undefined) {
                const adjustedPos = template.start + nodePos;
                tr.setNodeAttribute(adjustedPos, contentAttribute, undefined);
              }
            });
            if(value !== undefined) {
              // Content areas can not be their own templates.
              tr.setNodeAttribute(pos, markerAttribute, undefined);
              tr.setNodeAttribute(pos, contentAttribute, value);
            }
            return true;
          }
        }
        return false;
      }
    };
  },
});
