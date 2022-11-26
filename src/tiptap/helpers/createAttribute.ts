import { Attribute } from '@tiptap/core'
import {
  JSDataType,
  JSDataTypes,
} from '@/ts/utilities/destringify'

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
