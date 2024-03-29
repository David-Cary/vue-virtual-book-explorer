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
        value: string,
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
        value: string,
      ) => ({ tr }) => {
        tr.setNodeAttribute(pos, 'id', value);
        const node = tr.doc.nodeAt(pos);
        return node ? node.attrs.id === value : false;
      },
    };
  },
});
