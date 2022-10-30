import {
  Extension,
  Attribute,
  CommandProps,
  getMarkType,
} from '@tiptap/core'

export interface EnableAttributesRule {
  types: string[];
  attributes: string[];
}

export interface EnableAttributesOptions {
  enable: EnableAttributesRule[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    enableAttributes: {
      /**
       * Modifies the attributes of a specific node.  This helps if there
       * are nested elements of the same type, like lists.
       */
      setNodeAttribute: (pos: number, key: string, value: unknown) => ReturnType,
      /**
       * Modifies the attributes of a specific mark.  This helps if there
       * are nested elements of the same type, like lists.
       */
      setMarkAttribute: (
        pos: number,
        markName: string,
        key: string,
        value: unknown
      ) => ReturnType,
    }
  }
}

export const EnableAttributes = Extension.create<EnableAttributesOptions>({
  name: 'enableAttributes',

  addOptions() {
    return {
      enable: [],
    }
  },

  addGlobalAttributes() {
    return this.options.enable.map(rule => {
      const resolvedAttribtes: Record<string, Partial<Attribute>> = {};
      for(const attributeName of rule.attributes) {
        resolvedAttribtes[attributeName] = {
          parseHTML: element => element.getAttribute(attributeName),
          renderHTML: attributes => {
            const renderedAttributes: Record<string, string> = {};
            if(attributes[attributeName]) {
              renderedAttributes[attributeName] = attributes[attributeName];
            }
            return renderedAttributes;
          }
        };
      }
      return {
        types: rule.types,
        attributes: resolvedAttribtes
      };
    });
  },

  addCommands() {
    return {
      setNodeAttribute: (
        pos: number,
        key: string,
        value: unknown
      ) => ({ tr }: CommandProps) => {
        tr.setNodeAttribute(pos, key, value);
        const node = tr.doc.nodeAt(pos);
        return node ? node.attrs[key] === value : false;
      },
      setMarkAttribute: (
        pos: number,
        typeOrName: string,
        key: string,
        value: unknown
      ) => ({ tr, state }: CommandProps) => {
        const node = tr.doc.nodeAt(pos);
        if(node) {
          const from = pos;
          const to = pos + node.nodeSize;
          const type = getMarkType(typeOrName, state.schema);
          const attributes = {
            [key]: value
          };
          node.marks.forEach(mark => {
            if (type === mark.type) {
              tr.addMark(from, to, type.create({
                ...mark.attrs,
                ...attributes,
              }))
            }
          })
          return true;
        }
        return false;
      },
    }
  },
});
