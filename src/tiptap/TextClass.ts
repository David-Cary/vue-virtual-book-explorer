import {
  Mark,
  getMarkAttributes,
  mergeAttributes,
} from '@tiptap/core'

export interface TextClassOptions {
  HTMLAttributes: Record<string, unknown>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textClass: {
      /**
       * Remove spans without inline class attributes.
       */
      removeEmptyTextClass: () => ReturnType,
    }
  }
}

export const TextClass = Mark.create<TextClassOptions>({
  name: 'textClass',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      class: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: element => {
          const hasClass = (element as HTMLElement).hasAttribute('class')

          if (!hasClass) {
            return false
          }

          return {}
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      removeEmptyTextClass: () => ({ state, commands }) => {
        const attributes = getMarkAttributes(state, this.type)
        const hasClass = Object.entries(attributes).some(([, value]) => !!value)

        if (hasClass) {
          return true
        }

        return commands.unsetMark('textClass')
      },
    }
  },

})
