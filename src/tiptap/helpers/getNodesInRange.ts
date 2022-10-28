import { Node } from 'prosemirror-model'

export interface NodeIterationReference {
  node?: Node;
  pos: number;
  parent?: Node | null;
  index?: number;
}

export default function getNodesInRange(
  doc: Node,
  from: number,
  to: number
): NodeIterationReference[] {
  const nodes: NodeIterationReference[] = [];
  doc.nodesBetween(from, to, (node, pos, parent, index) => {
    nodes.push({
      node,
      pos,
      parent,
      index,
    });
  });
  return nodes;
}
