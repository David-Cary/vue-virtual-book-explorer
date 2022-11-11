import {
  Node,
  mergeAttributes,
  CommandProps,
  NodeRange,
  Range,
  Predicate,
  getNodeType,
} from '@tiptap/core'
import {
  Node as PMNode,
  NodeRange as PMNodeRange,
  NodeType,
} from 'prosemirror-model'
import { Transaction } from 'prosemirror-state'
import { findWrapping } from 'prosemirror-transform'

export interface SnippetOptions {
  HTMLAttributes: Record<string, unknown>,
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    snippet: {
      /**
       * Add an snippet
       */
      setSnippet: () => ReturnType,
      /**
       * If selection cover a single snippet, remove it.
       * Otherwise, wrap the selection in a snippet.
       */
      toggleSnippet: () => ReturnType,
      /**
       * Removes outermost snippet wrappers.
       */
      unwrapSnippet: () => ReturnType,
    }
  }
}

export const Snippet = Node.create<SnippetOptions>({
  name: 'snippet',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  inline: true,

  group: 'inline',

  content: 'inline+',
  draggable: true,

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`
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
    ]
  },

  addCommands() {
    return {
      setSnippet: () => ({ tr, state, commands }: CommandProps) => {
        // Split ranges up by block.
        const selection = tr.selection;
        const { from, to } = selection;
        const ranges = getBlockRanges(tr.doc, from, to);
        const updatedRange = { from, to };
        const type = getNodeType(this.name, state.schema);
        for(let i = 0; i < ranges.length; i++) {
          const range = ranges[i];
          const matchedSnippet = findEnclosingParent(
            tr.doc,
            range.from,
            range.to,
            node => node.type.name === this.name
          );
          if(!matchedSnippet) {
            wrapBlockRange(tr, type, ranges, i, updatedRange);
          }
        }
        commands.setTextSelection(updatedRange);
        return true;
      },
      toggleSnippet: () => ({ tr, state, commands }: CommandProps) => {
        // Split ranges up by block.
        const selection = tr.selection;
        const { from, to } = selection;
        const ranges = getBlockRanges(tr.doc, from, to);
        const updatedRange = { from, to };
        const type = getNodeType(this.name, state.schema);
        for(let i = 0; i < ranges.length; i++) {
          const range = ranges[i];
          const matchedSnippet = findEnclosingParent(
            tr.doc,
            range.from,
            range.to,
            node => node.type.name === this.name
          );
          if(matchedSnippet) {
            const slice = tr.doc.slice(matchedSnippet.from, matchedSnippet.to);
            tr.replaceWith(
              matchedSnippet.from - 1,
              matchedSnippet.to,
              slice.content
            );
            if(i === 0) {
              updatedRange.from = matchedSnippet.from - 1;
            }
            if(i + 1 === ranges.length) {
              updatedRange.to = matchedSnippet.to - 1;
            }
          } else {
            wrapBlockRange(tr, type, ranges, i, updatedRange);
          }
        }
        commands.setTextSelection(updatedRange);
        return true;
      },
      unwrapSnippet: () => ({ tr, commands }: CommandProps) => {
        // Split ranges up by block.
        const selection = tr.selection;
        const { from, to } = selection;
        const ranges = getBlockRanges(tr.doc, from, to);
        const updatedRange = { from, to };
        for(let i = 0; i < ranges.length; i++) {
          const range = ranges[i];
          const parentSnippet = findRangeParent(
            tr.doc,
            range.from,
            range.to,
            node => node.type.name === this.name
          );
          if(parentSnippet) {
            unwrapSnippetRange(tr, parentSnippet);
            if(i === 0) {
              updatedRange.from = parentSnippet.from;
            }
            if(i + 1 === ranges.length) {
              updatedRange.to = parentSnippet.to - 2;
            }
          } else {
            tr.doc.nodesBetween(range.from, range.to, (node, pos) => {
              if(node.type.name === this.name) {
                const snippetRange = {
                  from: pos,
                  to: pos + node.nodeSize
                };
                unwrapSnippetRange(tr, snippetRange);
                if(updatedRange.from === snippetRange.from) {
                  updatedRange.from--;
                }
                if(updatedRange.to === snippetRange.to) {
                  updatedRange.to--;
                }
                return false;
              }
            });
          }
        }
        commands.setTextSelection(updatedRange);
        return true;
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        // This fixes the issue with starting a new line failing if triggered
        // inside a snippet.
        const { selection } = this.editor.state;
        const { $from } = selection;
        if(selection.empty
          && $from.parent.type.name === this.name
        ) {
          for(let i = $from.depth - 1; i >= 0; i--) {
            if($from.node(i).type.name !== this.name) {
              const snippetIndex = i + 1;
              const posInSnippet = $from.pos - $from.start(snippetIndex);
              const snippetSize = $from.node(snippetIndex).nodeSize;
              const breakPos = posInSnippet < 0.5 * snippetSize
                ? $from.before(snippetIndex)
                : $from.after(snippetIndex);
              this.editor.commands.setTextSelection(breakPos)
              break;
            }
          }
        }
        return false;
      },
      Space: () => {
        // If the snippet is at the start of a block, adding spaces added
        // to the front of it should come before the snippet.
        const { selection } = this.editor.state;
        const { $from } = selection;
        if(selection.empty
          && $from.parent.type.name === this.name
          && $from.parentOffset === 0
        ) {
          for(let i = $from.depth - 1; i >= 0; i--) {
            if($from.index(i) > 0
              || $from.node(i).type.name !== this.name
            ) {
              this.editor.commands.insertContentAt($from.start(i), ' ');
              return true;
            }
          }
        }
        return false;
      },
      'Shift-Space': () => {
        // Use this key combo to add a space outside the enclosing snippet.
        // This is especially useful when the snippet is at the end of the
        // current block.
        const { selection } = this.editor.state;
        const { $from } = selection;
        if(selection.empty
          && $from.parent.type.name === this.name
          && !$from.nodeAfter
        ) {
          for(let i = $from.depth - 1; i >= 0; i--) {
            const wrapper = $from.node(i);
            if($from.index(i) < wrapper.nodeSize
              || wrapper.type.name !== this.name
            ) {
              this.editor.commands.insertContentAt($from.end(i), ' ');
              return true;
            }
          }
        }
        return false;
      },
    }
  },
})

function wrapBlockRange(
  tr: Transaction,
  type: NodeType,
  blockRanges: NodeRange[],
  index: number,
  selectionRange: Range,
): void {
  const range = blockRanges[index];
  const resolvedFrom = tr.doc.resolve(range.from);
  const resolvedTo = tr.doc.resolve(range.to);
  const resolvedRange = new PMNodeRange(
    resolvedFrom,
    resolvedTo,
    resolvedFrom.sharedDepth(resolvedTo.pos)
  );
  const wrapping = findWrapping(resolvedRange, type);
  if(wrapping) {
    tr.wrap(resolvedRange, wrapping);
    if(index === 0) {
      selectionRange.from = range.from + 1;
    }
    if(index + 1 === blockRanges.length) {
      selectionRange.to = range.to + 1;
    }
  }
}

function unwrapSnippetRange(
  tr: Transaction,
  range: Range,
): void {
  const slice = tr.doc.slice(
    range.from + 1,
    range.to - 1
  );
  tr.replaceWith(
    range.from,
    range.to,
    slice.content
  );
}

export function getBlockRanges(
  source: PMNode,
  from: number,
  to: number
): NodeRange[] {
  const ranges: NodeRange[] = [];
  source.nodesBetween(from, to, (node, pos) => {
    if(node.isBlock && !node.firstChild?.isBlock) {
      ranges.push({
        node,
        from: Math.max(from, pos),
        to: Math.min(to, pos + node.nodeSize),
      });
      return false;
    }
  });
  return ranges;
}

export function findEnclosingParent(
  source: PMNode,
  from: number,
  to: number,
  predicate: Predicate
): NodeRange | null {
  // Verify positions enclose all contents of their respective parents.
  const $from = source.resolve(from);
  if($from.start($from.depth) !== from) {
    return null;
  }
  const $to = source.resolve(to);
  if($to.end($to.depth) !== to) {
    return null;
  }
  // Cycle up both branches.
  const maxDepth = Math.max($from.depth, $to.depth);
  let fromAncestor = $from.parent;
  let toAncestor = $to.parent;
  let sharedAncestor = fromAncestor === toAncestor ? fromAncestor : null;
  let ancestorDepth = maxDepth;
  for(let i = maxDepth; i > 0; i--) {
    if(sharedAncestor) {
      if(predicate(sharedAncestor)) {
        return {
          from: $from.start(ancestorDepth),
          to: $from.end(ancestorDepth),
          node: sharedAncestor
        };
      } else {
        const nextAncestor = $from.node(i);
        if(nextAncestor.childCount === 1) {
          sharedAncestor = nextAncestor;
        } else {
          return null;
        }
      }
    } else {
      if(i < $from.depth) {
        const nextAncestor = $from.node(i);
        if(nextAncestor.firstChild === fromAncestor) {
          fromAncestor = nextAncestor;
        } else {
          return null;
        }
      }
      if(i < $to.depth) {
        const nextAncestor = $to.node(i);
        if(nextAncestor.lastChild === toAncestor) {
          toAncestor = nextAncestor;
        } else {
          return null;
        }
      }
      if(fromAncestor === toAncestor) {
        sharedAncestor = fromAncestor;
      } else {
        ancestorDepth--;
      }
    }
  }
  return null;
}

export function findRangeParent(
  source: PMNode,
  from: number,
  to: number,
  predicate: Predicate
): NodeRange | null {
  const $from = source.resolve(from);
  const sharedDepth = $from.sharedDepth(to);
  for(let i = sharedDepth; i > 0; i--) {
    const ancestor = $from.node(i);
    if(predicate(ancestor)) {
      const ancestorFrom = i > 0 ? $from.before(i) : 0;
      return {
        from: ancestorFrom,
        to: ancestorFrom + ancestor.nodeSize,
        node: ancestor,
      };
    }
  }
  return null;
}
