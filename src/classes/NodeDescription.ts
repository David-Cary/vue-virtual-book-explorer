export interface NodeDescriptionData {
  attrs?: { [key: string]: string };
}

export type NodeDescriptionChild = (NodeDescription | string);

export default class NodeDescription {
  tag = '';
  data?: NodeDescriptionData;
  children?: NodeDescriptionChild[];

  static describeAttributes(source: Element): { [key: string]: string } {
    const description: { [key: string]: string } = {};
    for(let i = 0; i < source.attributes.length; i++) {
      const attribute = source.attributes.item(i);
      if(attribute) {
        description[attribute.localName] = attribute.value;
      }
    }
    return description;
  }

  static describeNode(source: Node): NodeDescription {
    const description: NodeDescription = {
      tag: source.nodeName,
      children: NodeDescription.describeNodeChildren(source),
    };
    if('attributes' in source) {
      const sourceElement = source as Element;
      if(sourceElement.attributes.length) {
        description.data = {
          attrs: NodeDescription.describeAttributes(sourceElement)
        };
      }
    }
    return description;
  }

  static describeNodeChildren(source: Node): NodeDescriptionChild[] {
    const description: NodeDescriptionChild[] = [];
    for(let i = 0; i < source.childNodes.length; i++) {
      const sourceChild = source.childNodes.item(i);
      switch(sourceChild.nodeType) {
        case Node.ELEMENT_NODE: {
          const convertedChild = NodeDescription.describeNode(sourceChild);
          description.push(convertedChild);
          break;
        }
        case Node.TEXT_NODE: {
          if(sourceChild.textContent) {
            description.push(sourceChild.textContent);
          }
          break;
        }
      }
    }
    return description;
  }

  static toHTML(description: NodeDescription | NodeDescriptionChild[]): string {
    if(Array.isArray(description)) {
      let html = '';
      for(const child of description) {
        if(typeof child === 'string') {
          html += child;
        } else {
          html += NodeDescription.toHTML(child);
        }
      }
      return html;
    }
    let attributes = '';
    if(description.data?.attrs) {
      for(const key in description.data.attrs) {
        const value = description.data.attrs[key];
        attributes += ` ${key}="${value}"`
      }
    }
    const contents = description.children
      ? NodeDescription.toHTML(description.children)
      : '';
    const html = `<${description.tag}${attributes}>${contents}</${description.tag}>`;
    return html;
  }
}
