import {
  Extension,
  mergeAttributes,
  NodeWithPos,
  findParentNodeClosestToPos,
} from '@tiptap/core'
import { Node } from 'prosemirror-model'
import { createAttribute } from '@/tiptap/helpers/createAttribute'
import {
  stringify,
  destringify,
} from '@/ts/utilities/destringify'


export interface ValueNodesOptions {
  types: string[];
}

export interface ValueNodeAttributes {
  globalName: string;
  localName: string;
  evaluateAs: string;
  hiddenValue: unknown;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    valueNodes: {
      /**
       * Enforces use of value node attributes.
       */
      setValueNode: (
        attributes: Partial<ValueNodeAttributes>,
        pos?: number,
      ) => ReturnType,
      /**
       * Removes value node attributes.
       */
      unsetValueNode: (pos?: number) => ReturnType,
    }
  }
}

export const ValueNodes = Extension.create<ValueNodesOptions>({
  name: 'valueNodes',

  addOptions() {
    return {
      types: [],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          globalName: createAttribute<string>({
            name: 'globalName',
            DOMName: 'data-global-name',
          }),
          localName: createAttribute<string>({
            name: 'localName',
            DOMName: 'data-local-name',
          }),
          evaluateAs: createAttribute<string>({
            name: 'evaluateAs',
            DOMName: 'data-evaluate-as'
          }),
          hiddenValue: {
            default: undefined,
            parseHTML: element => {
              const valueString = element.getAttribute('data-hidden-value');
              if(valueString !== null) {
                const valueType = element.getAttribute('data-hidden-value-type')
                  || 'string';
                return destringify(valueString, valueType);
              }
              return undefined;
            },
            renderHTML: attributes => {
              const results: Record<string, string> = {};
              if(attributes.hiddenValue !== undefined) {
                results['data-hidden-value'] = stringify(attributes.hiddenValue);
                const valueType = typeof attributes.hiddenValue;
                if(valueType !== 'string') {
                  results['data-hidden-value-type'] = valueType;
                }
              }
              return results;
            },
          },
        }
      }
    ];
  },

  addCommands() {
    return {
      setValueNode: (
        attributes: Partial<ValueNodeAttributes>,
        pos?: number
      ) => ({ tr, commands }) => {
        if(pos !== undefined) {
          const node = tr.doc.nodeAt(pos);
          if(node) {
            const updatedAttributes = mergeAttributes(
              node.attrs,
              attributes,
            );
            tr.setNodeMarkup(pos, null, updatedAttributes);
          }
        } else {
          const { selection } = tr;
          const { $from, $to } = selection;
          const depth = $from.sharedDepth($to.pos);
          const pos = $from.start(depth - 1);
          commands.setValueNode(attributes, pos);
        }
        return true;
      },
      unsetValueNode: (
        pos?: number
      ) => ({ tr, commands }) => {
        if(pos !== undefined) {
          const node = tr.doc.nodeAt(pos);
          if(node) {
            const attributes = { ...node.attrs };
            for(const key in [
              'localName',
              'evaluateAs',
              'hiddenValue',
            ]) {
              if(attributes[key] !== undefined) {
                delete attributes[key];
              }
            }
            tr.setNodeMarkup(pos, null, attributes);
          }
        } else {
          const { selection } = tr;
          const { from, to } = selection;
          tr.doc.nodesBetween(
            from,
            to,
            (node, pos) => commands.unsetValueNode(pos)
          );
        }
        return true;
      },
    };
  },
});

export function getNestedValueNode(
  source: Node,
  path: string[],
): Node | null {
  if(path.length) {
    for(let i = 0; i < source.childCount; i++) {
      const child = source.child(i);
      if(child) {
        if(child.attrs.localName === path[0]) {
          const subpath = path.slice(1);
          return getNestedValueNode(child, subpath);
        }
        const match = getNestedValueNode(child, path);
        if(match) {
          return match;
        }
      }
    }
    return null;
  }
  return source;
}

export interface EvaluationOptions {
  evaluators: Record<string, EvaluationFunction>;
}

export type EvaluationFunction = (node: Node, options?: EvaluationOptions) => unknown;

export const defaultEvaluators: Record<string, EvaluationFunction> = {
  text: (node) => node.textContent,
  number: (node) => Number(node.textContent),
  JSON: (node) => node.toJSON(),
  object: (node, options) => createValueObject(node, options),
  array: (node, options) => createValueArray(node, options),
};

export function getNodeValue(
  node: Node,
  options = {
    evaluators: defaultEvaluators,
  },
): unknown {
  const evaluateAs = node.attrs.evaluateAs;
  const evaluate = options.evaluators[evaluateAs];
  if(evaluate) {
    return evaluate(node, options);
  }
  const hiddenValue = node.attrs.hiddenValue;
  if(hiddenValue !== undefined) {
    return hiddenValue;
  }
  return undefined;
}

export function createValueObject(
  source: Node,
  options = {
    evaluators: defaultEvaluators,
  },
): Record<string, unknown> {
  const results: Record<string, unknown> = {};
  source.descendants(child => {
    const propertyName = child.attrs.localName;
    if(propertyName) {
      results[propertyName] = getNodeValue(source, options);
      return false;
    }
  });
  return results;
}

export function createValueArray(
  source: Node,
  options = {
    evaluators: defaultEvaluators,
  },
): unknown[] {
  const results: unknown[] = [];
  source.descendants(child => {
    if(child.attrs.evaluateAs || child.attrs.hiddenValue !== undefined) {
      const value = getNodeValue(source, options);
      results.push(value);
      return false;
    }
  });
  return results;
}

export function getLocalValuesAt(
  doc: Node,
  pos: number,
): Record<string, NodeWithPos> {
  const results: Record<string, NodeWithPos> = {};
  const resolved = doc.resolve(pos);
  const namedAncestor = findParentNodeClosestToPos(
    resolved,
    node => node.attrs.globalName
      || node.attrs.localName
      || node.attrs.evaluateAs
  );
  const owner = namedAncestor?.node || doc;
  owner.descendants((node, pos) => {
    const key = node.attrs.localName;
    if(key) {
      results[key] = { node, pos };
    }
  });
  return results;
}
