import {
  Node,
  mergeAttributes,
  JSONContent,
  getHTMLFromFragment,
} from '@tiptap/core'
import { Node as PMNode } from 'prosemirror-model'

export interface InlineInstanceOptions {
  HTMLAttributes: Record<string, unknown>,
  getTemplate: (id: string) => JSONContent | null,
}

export const InlineInstance = Node.create<InlineInstanceOptions>({
  name: 'inlineInstance',

  addOptions() {
    return {
      HTMLAttributes: {},
      getTemplate: () => {
        return {
          content: [
            {
              type: 'text',
              text: '?',
            },
          ],
        }
      },
    }
  },

  inline: true,

  group: 'inline',

  content: 'inline*',

  addAttributes() {
    return {
      instanceOf: {
        default: '',
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
      0
    ];
  },

  addNodeView() {
    return ({ node }) => {

      const templateId = node.attrs.instanceOf;
      const template = this.options.getTemplate(templateId);
      let dom: Element | null;
      if(template) {
        const docNode = PMNode.fromJSON(
          this.editor.schema,
          {
            type: 'doc',
            content: [template],
          },
        );
        const html = getHTMLFromFragment(
          docNode.content,
          this.editor.schema
        );
        const wrapper = document.createElement('template');
        wrapper.innerHTML = html;
        dom = wrapper.content.firstElementChild;
      } else {
        dom = document.createElement('span');
        dom.innerHTML = '-';
      }

      if(dom) {
        dom.setAttribute('data-type', this.name);
      }

      return {
        dom,
      }
    }
  },
})
