import { Extension } from '@tiptap/core'

export interface ClassedNodesOptions {
  types: string[];
}

export interface IdentifiedNodeAttributes {
  class: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    classedNodes: {
      /**
       * Enforces use of value node attributes.
       */
      setNodeClass: (
        pos: number,
        value: string,
      ) => ReturnType,
    }
  }
}

export const ClassedNodes = Extension.create<ClassedNodesOptions>({
  name: 'classedNodes',

  addOptions() {
    return {
      types: [],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          class: {
            default: undefined,
            parseHTML: element => element.getAttribute('class'),
            renderHTML: attributes => {
              const results: Record<string, string> = {};
              if(attributes.class !== undefined) {
                results.class = attributes.class;
              }
              return results;
            },
          },
        }
      }
    ];
  },

  addCommands() {
    return {
      setNodeClass: (
        pos: number,
        value: string,
      ) => ({ tr }) => {
        tr.setNodeAttribute(pos, 'class', value);
        const node = tr.doc.nodeAt(pos);
        return node ? node.attrs.class === value : false;
      },
    };
  },
});
