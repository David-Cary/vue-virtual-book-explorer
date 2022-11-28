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
  contentQuery?: string,
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

      let contentDOM: Element | null = null;
      if(dom) {
        dom.setAttribute('data-type', this.name);
        if(this.options.contentQuery) {
          contentDOM = dom.querySelector(this.options.contentQuery);
        }
      }

      return {
        dom,
        contentDOM,
      }
    }
  },
})
