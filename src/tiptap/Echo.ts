import {
  Node,
  mergeAttributes,
  getHTMLFromFragment,
  JSONContent,
  CommandProps,
} from '@tiptap/core'
import {
  Node as PMNode,
} from 'prosemirror-model'
import { createAttribute } from '@/tiptap/helpers/createAttribute'

export interface EchoOptions {
  HTMLAttributes: Record<string, unknown>,
  getTemplate: (
    path: (string | number)[]
  ) => JSONContent | string | undefined | null,
  placeholder: string,
  castableTypes: string[],
  getContentPath: (source: JSONContent) => (string | number)[] | undefined,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    echo: {
      /**
       * Converts the selection to the source path of a new echo node.
       */
      insertEcho: () => ReturnType,
      /**
       * Replaces all echo nodes in the selection with their source path text.
       */
      undoEchoes: () => ReturnType,
      /**
       * Replaces all echo nodes in the selection with a copy of their source.
       */
      instantiateEchoes: () => ReturnType,
    }
  }
}

export const Echo = Node.create<EchoOptions>({
  name: 'echo',

  addOptions() {
    return {
      HTMLAttributes: {},
      getTemplate: () => {
        return undefined;
      },
      placeholder: '{?}',
      castableTypes: [],
      getContentPath: (source) => {
        return source.attrs?.echoedPath;
      },
    }
  },

  group: 'inline',

  inline: true,

  atom: true,

  addAttributes() {
    return {
      sourcePath: {
        default: [],
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `[data-type="${this.name}"]`,
      },
    ]
  },

  renderHTML({ HTMLAttributes }: {HTMLAttributes: Record<string, unknown>}) {
    return [
      'span',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        { 'data-type': this.name }
      ),
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.setAttribute('data-type', this.name);
      dom.setAttribute('data-source-path', node.attrs.sourcePath.join('.'));

      const template = this.options.getTemplate(node.attrs.sourcePath);
      if(template) {
        if(typeof template === 'object') {
          const docNode = PMNode.fromJSON(
            this.editor.schema,
            {
              type: 'doc',
              content: [template],
            },
          );
          const html = getHTMLFromFragment(
            docNode.content,
            this.editor.schema,
          );
          dom.innerHTML = html;
        } else {
          dom.innerHTML = template;
        }
      } else {
        dom.innerHTML = this.options.placeholder;
      }

      return {
        dom,
      };
    }
  },

  addCommands() {
    return {
      insertEcho: () => ({ tr, commands }: CommandProps) => {
        const selection = tr.selection;
        const { from, to } = selection;
        const text = tr.doc.textBetween(from, to);
        commands.deleteSelection();
        return commands.insertContent({
          type: this.name,
          attrs: {
            sourcePath: text.split('.'),
          },
        });
      },
      undoEchoes: () => ({ tr, commands }: CommandProps) => {
        const selection = tr.selection;
        const { from, to } = selection;
        tr.doc.nodesBetween(from, to, (node, pos) => {
          if(node.type.name === this.name) {
            const text = node.attrs.sourcePath.join('.');
            tr.deleteRange(pos, pos + node.nodeSize);
            commands.insertContentAt(pos, text);
          }
        });
        return true;
      },
      instantiateEchoes: () => ({ tr, commands }: CommandProps) => {
        const selection = tr.selection;
        const { from, to } = selection;
        tr.doc.nodesBetween(from, to, (node, pos) => {
          if(node.type.name === this.name) {
            const template = this.options.getTemplate(node.attrs.sourcePath);
            if(template) {
              const echoed = typeof template === 'object'
                ? cloneTemplateWithEchoes(
                  template,
                  this.name,
                  this.options,
                )
                : template;
              tr.deleteRange(pos, pos + node.nodeSize);
              commands.insertContentAt(pos, echoed);
            }
          }
        });
        return true;
      },
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.castableTypes,
        attributes: {
          echoInTemplate: createAttribute<boolean>({
            name: 'echoInTemplate',
            DOMName: 'data-echo-in-template',
            dataType: 'boolean',
          }),
        }
      }
    ];
  },
})

export function cloneTemplateWithEchoes(
  source: JSONContent,
  typeName: string,
  options: EchoOptions,
): JSONContent {
  const result: JSONContent = { ...source };
  if(result.content) {
    result.content = cloneEchoableContent(result.content, typeName, options);
  }
  return result;
}

export function cloneEchoableContent(
  source: JSONContent[],
  typeName: string,
  options: EchoOptions,
): JSONContent[] {
  return source.map(item => {
    if(item.attrs?.echoInTemplate) {
      const sourcePath = options.getContentPath(item);
      if(sourcePath) {
        return {
          type: typeName,
          attrs: {
            sourcePath,
          },
        }
      }
    }
    return cloneTemplateWithEchoes(item, typeName, options);
  });
}
