import { Node, mergeAttributes, CommandProps } from '@tiptap/core'

export interface TextBlockOptions {
  HTMLAttributes: Record<string, unknown>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textBlock: {
      /**
       * Toggle a text block
       */
      setTextBlock: () => ReturnType,
    }
  }
}

export const TextBlock = Node.create<TextBlockOptions>({
  name: 'textBlock',

  priority: 1000,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  content: 'inline*',

  defining: true,

  parseHTML() {
    return [
      {
        tag: `div[data-type="${this.name}"]`,
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
      setTextBlock: () => ({ commands }: CommandProps) => {
        return commands.setNode('textBlock')
      },
    }
  },
})
