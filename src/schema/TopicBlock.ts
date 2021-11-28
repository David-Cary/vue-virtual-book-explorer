import { Node, mergeAttributes, CommandProps } from '@tiptap/core'

export interface TopicBlockOptions {
  HTMLAttributes: Record<string, unknown>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    topicBlock: {
      /**
       * Toggle a bullet list
       */
      toggleTopicBlock: () => ReturnType,
    }
  }
}

export const TopicBlock = Node.create<TopicBlockOptions>({
  name: 'topicBlock',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  content: 'block+',

  addAttributes() {
    return {
      id: {
        default: undefined,
      },
      name: {
        default: undefined,
      },
      class: {
        default: undefined,
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'div[data-type="topic"]' },
    ]
  },

  renderHTML({ HTMLAttributes }: {HTMLAttributes: Record<string, unknown>}) {
    return [
      'div',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        { 'data-type': 'topic' }
      ),
      0
    ];
  },

  addCommands() {
    return {
      toggleTopicBlock: () => ({ commands }: CommandProps) => {
        return commands.toggleList('topicBlock', 'paragraph')
      },
    }
  },
})
