import {
  Extension,
  Attribute,
  mergeAttributes,
} from '@tiptap/core'
import { Node } from 'prosemirror-model'

export interface ValueNodesOptions {
  types: string[];
}

export interface ValueNodeAttributes {
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
          localName: createAliasedAttribute('localName', 'data-local-name'),
          evaluateAs: createAliasedAttribute('evaluateAs', 'data-evaluate-as'),
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

export function createAliasedAttribute(
  attributeName: string,
  domAttribute: string,
  defaultValue?: unknown
): Partial<Attribute> {
  const aliased: Partial<Attribute> = {
    default: defaultValue,
    parseHTML: (element: Element) => element.getAttribute(domAttribute),
    renderHTML: (attributes: Record<string, string>) => {
      const renderedAttributes: Record<string, string> = {};
      if(attributes[attributeName]) {
        renderedAttributes[domAttribute] = attributes[attributeName];
      }
      return renderedAttributes;
    },
  };
  return aliased;
}

export interface JSDataType<T> {
  name: string;
  stringify: (value: T) => string;
  destringify: (value: string) => T;
}

export const JSDataTypes: Record<string, Partial<JSDataType<unknown>>> = {
  boolean: {
    destringify: value => value === 'true',
  },
  number: {
    destringify: value => Number(value),
  },
  object: {
    stringify: value => {
      if(value) {
        return JSON.stringify(value);
      }
      return '';
    },
    destringify: value => {
      try {
        return JSON.parse(value);
      } catch(error) {
        return null;
      }
    }
  },
  string: {},
  undefined: {
    stringify: () => '',
    destringify: () => undefined,
  }
}

export function stringify(value: unknown): string {
  const dataType = JSDataTypes[typeof value];
  if(dataType?.stringify) {
    return dataType.stringify(value);
  }
  return String(value);
}

export function destringify(value: string, type: string): unknown {
  const dataType = JSDataTypes[type];
  if(dataType?.destringify) {
    return dataType.destringify(value);
  }
  return value;
}

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
