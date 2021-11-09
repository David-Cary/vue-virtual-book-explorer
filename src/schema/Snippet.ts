import {
  Node,
  mergeAttributes,
} from '@tiptap/core'

export interface SnippetOptions {
  HTMLAttributes: Record<string, unknown>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    snippet: {
      /**
       * Add an snippet
       */
      setSnippet: (options: { id: string }) => ReturnType,
      /**
       * Add an snippet
       */
      releaseSnippet: () => ReturnType,
    }
  }
}

export const Snippet = Node.create<SnippetOptions>({
  name: 'snippet',

  addOptions() {
    return {
      inline: true,
      HTMLAttributes: {},
    }
  },

  inline: true,

  group: 'inline',

  content: 'inline+',

  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[id]'
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0
    ]
  },

  addCommands() {
    return {
      setSnippet: options => ({ tr, commands }) => {
        const selection = tr.selection;
        if(!selection.$anchor.sameParent(selection.$head)) {
          return false;
        }
        const { from, to } = selection;
        const selectionFragment = tr.doc.cut(from, to);
        const selectionBlock = selectionFragment.firstChild;
        if(selectionBlock) {
          const blockJSON = selectionBlock.toJSON();
          const inserted = commands.insertContent({
            type: this.name,
            attrs: options,
            content: blockJSON.content,
          });
          if(inserted) {
            return commands.setTextSelection({ from: from + 1, to: to + 1});
          }
        }
        return false;
      },
      releaseSnippet: () => ({ tr, dispatch }) => {
        const selection = tr.selection;
        if(selection.$anchor.sameParent(selection.$head)) {
          for(let i = selection.$anchor.depth; i >= 0; i--) {
            const ancestor = selection.$anchor.node(i);
            if(ancestor.type === this.type) {
              if (dispatch) {
                const from =  selection.$anchor.before(i);
                const to =  selection.$anchor.after(i);
                tr.replaceWith(from, to, ancestor.content).scrollIntoView();
              }
              return true;
            }
          }
        }
        return false;
      }
    }
  },
})
