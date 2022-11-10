import { Attribute } from '@tiptap/core'

export interface JSDataType<T> {
  name: string;
  stringify: (value: T) => string;
  destringify: (value: string | null) => T;
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
        return value ? JSON.parse(value) : null;
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

export function destringify(value: string | null, type: string): unknown {
  const dataType = JSDataTypes[type];
  if(dataType?.destringify) {
    return dataType.destringify(value);
  }
  return value;
}

export interface CreateAttributeOptions<T> {
  name: string;
  DOMName: string;
  dataType: Partial<JSDataType<T>> | string;
  defaultValue: T;
}

export function createAttribute<T>(
  options: Partial<CreateAttributeOptions<T>>
): Partial<Attribute> {
  const attr: Partial<Attribute> = {
    default: options.defaultValue,
  };
  if(options.name) {
    const name = options.name;
    const alias = options.DOMName || name;
    const dataType = typeof options.dataType === 'string'
      ? ( JSDataTypes[options.dataType] || { name: options.dataType} )
      : options.dataType;
    if(dataType?.destringify) {
      const localDestringify = dataType.destringify;
      attr.parseHTML = (element: Element) => {
        const rawValue = element.getAttribute(alias);
        return localDestringify(rawValue);
      };
    } else {
      attr.parseHTML = (element: Element) => element.getAttribute(alias);
    }
    if(dataType) {
      const localStringify = dataType.stringify || String;
      attr.renderHTML = (attributes: Record<string, unknown>) => {
        const renderedAttributes: Record<string, string> = {};
        if(attributes[name]) {
          const rawValue = attributes[name] as T;
          renderedAttributes[alias] = localStringify(rawValue);
        }
        return renderedAttributes;
      };
    } else {
      attr.renderHTML = (attributes: Record<string, string>) => {
        const renderedAttributes: Record<string, string> = {};
        if(attributes[name]) {
          renderedAttributes[alias] = attributes[name];
        }
        return renderedAttributes;
      };
    }
  }
  return attr;
}
