import {
  Mark,
  getMarkAttributes,
  mergeAttributes,
} from '@tiptap/core'

export interface TextNameOptions {
  HTMLAttributes: Record<string, unknown>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textName: {
      /**
       * Remove spans without name attributes.
       */
      removeEmptyTextName: () => ReturnType,
    }
  }
}

export const TextName = Mark.create<TextNameOptions>({
  name: 'textName',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      name: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: element => {
          const hasName = (element as HTMLElement).hasAttribute('name')

          if (!hasName) {
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
      removeEmptyTextName: () => ({ state, commands }) => {
        const attributes = getMarkAttributes(state, this.type)
        const hasName = Object.entries(attributes).some(([, value]) => !!value)

        if (hasName) {
          return true
        }

        return commands.unsetMark('textName')
      },
    }
  },

})
