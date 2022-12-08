import {
  Node,
  mergeAttributes,
  CommandProps,
  JSONContent,
  Attributes,
} from '@tiptap/core'

export interface CompileTextProps {
  expression: string;
  context: Record<string, unknown>;
}

export interface SVGOptions {
  HTMLAttributes: Record<string, unknown>,
  placeholder: JSONContent[],
}

export type PositionValue = string | number;

export interface Rectangle {
  x: PositionValue,
  y: PositionValue,
  width: PositionValue,
  height: PositionValue,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    svg: {
      /**
       * Converts the selection to the source path of a new echo node.
       */
      initSVGAt: (
        pos: number,
        source: string | JSONContent,
      ) => ReturnType,
      /**
       * Modifies the viewBox attribute of svgs.
       */
      setSVGViewBox: (
        changes: Partial<Rectangle>,
        pos?: number,
      ) => ReturnType,
      /**
       * Modifies the height and width attributes of a node.
       */
      setDimensions: (
        changes: Partial<Rectangle>,
        pos?: number,
      ) => ReturnType,
    }
  }
}

export const SVG = Node.create<SVGOptions>({
  name: 'svg',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        version: '1.1',
        xmlns: 'http://www.w3.org/2000/svg',
      },
      placeholder: [
        {
          type: 'rect',
          attrs: {
            x: 0,
            y: 0,
            width: 16,
            height: 16,
            fill: 'silver',
          },
        }
      ],
    }
  },

  addAttributes() {
    return {
      _content: {
        default: undefined,
      },
      width: {
        default: '1em',
      },
      height: {
        default: '1em',
      },
      viewBox: {
        default: undefined,
      },
      preserveAspectRatio: {
        default: undefined,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: `svg`,
      },
    ]
  },

  renderHTML({ HTMLAttributes }: {HTMLAttributes: Record<string, unknown>}) {
    const attributes = mergeAttributes(
      this.options.HTMLAttributes,
      HTMLAttributes,
    );
    const dom = renderSVG(
      this.name,
      attributes,
      this.options.placeholder,
    );
    if(dom) {
      return {
        dom,
      }
    }
    return [
      'svg',
      attributes,
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = renderSVG(
        node.type.name,
        node.attrs,
        this.options.placeholder,
      );

      return {
        dom,
      }
    }
  },

  addCommands() {
    return {
      initSVGAt: (
        pos: number,
        source: string | JSONContent,
      ) => ({ tr }: CommandProps) => {
        const node = tr.doc.nodeAt(pos);
        if(node) {
          let data: JSONContent | null;
          if(typeof source === 'string') {
            const json = HTMLToJSON(source);
            data = Array.isArray(json) ? json[0] : json;
          } else {
            data = source;
          }
          if(data?.type === this.name) {
            const attributes = data.attrs || {};
            if(data.content) {
              attributes._content = data.content;
            }
            tr.setNodeMarkup(pos, null, attributes);
          }
        }
        return true;
      },
      setSVGViewBox: (
        changes: Partial<Rectangle>,
        pos?: number,
      ) => ({ tr, commands }: CommandProps) => {
        if(pos !== undefined) {
          const node = tr.doc.nodeAt(pos);
          if(node?.type.name === this.name) {
            const viewBoxText = node.attrs?.viewBox || '0 0 0 0';
            const viewBoxTerms = viewBoxText.split(' ');
            if(changes.x) {
              viewBoxTerms[0] = String(changes.x);
            }
            if(changes.y) {
              viewBoxTerms[1] = String(changes.y);
            }
            if(changes.width) {
              viewBoxTerms[2] = String(changes.width);
            }
            if(changes.height) {
              viewBoxTerms[3] = String(changes.height);
            }
            const updatedText = viewBoxTerms.join(' ');
            tr.setNodeAttribute(pos, 'viewBox', updatedText);
          }
        } else {
          const { selection } = tr;
          const { from, to } = selection;
          tr.doc.nodesBetween(
            from,
            to,
            (node, pos) => commands.setSVGViewBox(changes, pos)
          );
        }
        return true;
      },
      setDimensions: (
        changes: Partial<Rectangle>,
        pos?: number,
      ) => ({ tr, commands }: CommandProps) => {
        if(pos !== undefined) {
          const node = tr.doc.nodeAt(pos);
          if(node) {
            if(changes.width && node.type.spec.attrs?.width) {
              tr.setNodeAttribute(pos, 'width', changes.width);
            }
            if(changes.height && node.type.spec.attrs?.height) {
              tr.setNodeAttribute(pos, 'height', changes.height);
            }
          }
        } else {
          const { selection } = tr;
          const { from, to } = selection;
          tr.doc.nodesBetween(
            from,
            to,
            (node, pos) => commands.setDimensions(changes, pos)
          );
        }
        return true;
      },
    };
  },
})

export function renderSVG(
  typeName: string,
  attrs: Attributes,
  placeholder?: JSONContent[],
): Element | null {
  const template: JSONContent = {
    type: typeName,
    attrs: { ...attrs },
  };
  if(template.attrs?._content) {
    template.content = template.attrs._content;
    delete template.attrs._content;
  } else if(placeholder) {
    template.content = placeholder
  }
  const wrapper = document.createElement('span');
  wrapper.innerHTML = JSONToHTML(template);
  return wrapper.firstChild as Element;
}

export function JSONToHTML(source: JSONContent | JSONContent[]): string {
  if(Array.isArray(source)) {
    const terms = source.map(item => JSONToHTML(item));
    return terms.join('');
  }
  const tag = source.type;
  const attrs = source.attrs || {};
  const attrEntries: string[] = [];
  for(const key in attrs) {
    const value = attrs[key];
    if(value !== undefined) {
      attrEntries.push(`${key}="${String(attrs[key])}"`);
    }
  }
  const attrsSection = attrEntries.length ? ` ${attrEntries.join(' ')}` : '';
  let innerHTML = '';
  if(source.content) {
    const contentHTML = source.content.map(item => JSONToHTML(item));
    innerHTML = contentHTML.join('');
  } else if(source.text) {
    innerHTML = source.text;
  }
  return `<${tag}${attrsSection}>${innerHTML}</${tag}>`;
}

export function HTMLToJSON(source: string): JSONContent | JSONContent[] | null {
  const wrapper = document.createElement('span');
  try {
    wrapper.innerHTML = source;
  } catch (error) {
    return null;
  }
  const json = ElementToJSON(wrapper);
  if(json.content) {
    return json.content.length === 1 ? json.content[0] : json.content;
  }
  return null;
}

export function ElementToJSON(source: Element): JSONContent {
  const result: JSONContent = {
    type: source.nodeName,
  };
  const numAttributes = source.attributes.length;
  if(numAttributes) {
    result.attrs = {};
    for(let i = 0; i < numAttributes; i++) {
      const item = source.attributes.item(i);
      if(item) {
        result.attrs[item.localName] = item.value;
      }
    }
  }
  for(const child of source.children) {
    const childJSON = ElementToJSON(child);
    if(!result.content) {
      result.content = [];
    }
    result.content.push(childJSON);
  }
  return result;
}
