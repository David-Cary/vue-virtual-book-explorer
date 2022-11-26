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
