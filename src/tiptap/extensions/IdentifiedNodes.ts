import { Extension } from '@tiptap/core'

export interface IdentifiedNodesOptions {
  types: string[];
}

export interface IdentifiedNodeAttributes {
  id: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    identifiedNodes: {
      /**
       * Enforces use of value node attributes.
       */
      setNodeId: (
        pos: number,
        attributes: IdentifiedNodeAttributes,
      ) => ReturnType,
    }
  }
}

export const IdentifiedNodes = Extension.create<IdentifiedNodesOptions>({
  name: 'identifiedNodes',

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
          id: {
            default: undefined,
            parseHTML: element => element.getAttribute('id'),
            renderHTML: attributes => {
              const results: Record<string, string> = {};
              if(attributes.id !== undefined) {
                results.id = attributes.id;
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
      setNodeId: (
        pos: number,
        attributes: IdentifiedNodeAttributes,
      ) => ({ tr }) => {
        tr.setNodeAttribute(pos, 'id', attributes.id);
        const node = tr.doc.nodeAt(pos);
        return node ? node.attrs.id === attributes.id : false;
      },
    };
  },
});
