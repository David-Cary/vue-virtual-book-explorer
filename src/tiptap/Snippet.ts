import {
  Node,
  mergeAttributes,
  CommandProps,
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
       * Remove a snippet
       */
      releaseSnippet: () => ReturnType,
    }
  }
}

export const Snippet = Node.create<SnippetOptions>({
  name: 'snippet',

  addOptions() {
    return {
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

  renderHTML({ HTMLAttributes }: {HTMLAttributes: Record<string, unknown>}) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0
    ]
  },

  addCommands() {
    return {
      setSnippet: (options: Record<string, unknown>) => ({ tr, commands }: CommandProps) => {
        const selection = tr.selection;
        if(!selection.$anchor.sameParent(selection.$head)) {
          return false;
        }
        const { from, to } = selection;
        const slice = tr.doc.slice(from, to);
        const sliceJSON = slice.toJSON();
        if(sliceJSON) {
          tr.doc.cut(from, to);
          const inserted = commands.insertContent({
            type: this.name,
            attrs: options,
            content: sliceJSON.content,
          });
          if(inserted) {
            return commands.setTextSelection({ from: from + 1, to: to + 1});
          }
        }
        return false;
      },
      releaseSnippet: () => ({ tr, dispatch }: CommandProps) => {
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
      },
    }
  },
})
