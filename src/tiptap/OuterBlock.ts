import { Node, mergeAttributes, CommandProps } from '@tiptap/core'

export interface OuterBlockOptions {
  HTMLAttributes: Record<string, unknown>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    outerBlock: {
      /**
       * Toggle a bullet list
       */
      toggleOuterBlock: () => ReturnType,
    }
  }
}

export const OuterBlock = Node.create<OuterBlockOptions>({
  name: 'outerBlock',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  content: 'block+',

  defining: true,

  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
        priority: 51,
      },
    ]
  },

  renderHTML({ HTMLAttributes }: {HTMLAttributes: Record<string, unknown>}) {
    return [
      'div',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        { 'data-type': this.name }
      ),
      0
    ];
  },

  addCommands() {
    return {
      toggleOuterBlock: () => ({ commands, tr }: CommandProps) => {
        const { selection } = tr;
        const { $from, $to } = selection;
        if($from.parent.isBlock && $to.parent.isBlock) {
          const fromWrapper = $from.node($from.depth - 1);
          const toWrapper = $to.node($from.depth - 1);
          if(fromWrapper === toWrapper
          ) {
            const firstBlock = fromWrapper.firstChild;
            const lastBlock = toWrapper.lastChild;
            if(!($from.parent === firstBlock && $to.parent === lastBlock)
              && !($from.parent === lastBlock && $to.parent === firstBlock)
            ) {
              return commands.wrapIn(this.name);
            }
          }
        }
        return commands.toggleWrap(this.name);
      },
    }
  },
})
