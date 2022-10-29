import {
  Node,
  mergeAttributes,
  CommandProps,
} from '@tiptap/core'

export interface CompileTextProps {
  expression: string;
  context: Record<string, unknown>;
}

export interface CompiledTextOptions {
  HTMLAttributes: Record<string, unknown>,
  context: Record<string, unknown>,
  compileText: (props: CompileTextProps) => string,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    compiledText: {
      /**
       * Converts the selection to the template of a new compiled text node.
       */
      wrapAsCompiledText: () => ReturnType,
      /**
       * Removes compiled text and replaces it with it's template.
       */
      unwrapCompiledText: () => ReturnType,
    }
  }
}

export const CompiledText = Node.create<CompiledTextOptions>({
  name: 'compiledText',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      context: {},
      compileText: ({ expression, context}) => {
        if(expression in context) {
          return String(context[expression]);
        }
        return expression;
      }
    }
  },

  addAttributes() {
    return {
      template: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ]
  },

  renderHTML({ HTMLAttributes }: {HTMLAttributes: Record<string, unknown>}) {
    const attributes = mergeAttributes(
      this.options.HTMLAttributes,
      HTMLAttributes,
      { 'data-type': this.name }
    );
    let text;
    try {
      text = this.options.compileText({
        expression: attributes.template,
        context: this.options.context,
      });
    } catch (error) {
      text = error.message;
    }
    return [
      'span',
      attributes,
      text
    ];
  },

  addCommands() {
    return {
      wrapAsCompiledText: () => ({ tr, commands }: CommandProps) => {
        const selection = tr.selection;
        const { from, to } = selection;
        const template = tr.doc.textBetween(from, to);
        commands.deleteSelection();
        return commands.insertContent({
          type: this.name,
          attrs: {
            template,
          },
        });
      },
      unwrapCompiledText: () => ({ tr, commands }: CommandProps) => {
        const selection = tr.selection;
        const { from, to } = selection;
        tr.doc.nodesBetween(from, to, (node, pos) => {
          if(node.type.name === this.name) {
            const text = node.attrs.template;
            tr.deleteRange(pos, pos + node.nodeSize);
            commands.insertContentAt(pos, text);
          }
        });
        return true;
      },
    }
  },
})
