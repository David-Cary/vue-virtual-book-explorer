import { Node, mergeAttributes } from '@tiptap/core'

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

  parseHTML() {
    return [
      { tag: 'div' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setTextBlock: () => ({ commands }) => {
        return commands.setNode('textBlock')
      },
    }
  },
})
