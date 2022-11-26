import {
  get,
  set,
  cloneDeep
} from 'lodash'

export type PathStep = string | number;

export interface RouteReadOptions {
  asArray: boolean;
}

export interface RouteValueReference {
  name?: string;
  path: PathStep[];
  asArray?: boolean;
  types?: string;
}

export interface RouteLiteral<T> {
  value: T;
}

export type RoutePathStep = string | RouteValueReference;

export type RouteParam<T> = RouteValueReference | RouteLiteral<T>;

export interface RouteSchema {
  path: RoutePathStep[],
  params?: Record<string, RouteParam<unknown>>;
  hash?: boolean;
}

export interface ResolvedRoute {
  path: string[],
  params?: Record<string, string>,
}

export default class RouteDataParser {
  schema: RouteSchema;

  constructor(schema: RouteSchema) {
    this.schema = schema;
  }

  getRoutePath(source: Record<string, unknown>): string {
    let results: string[] = [];
    for(const step of this.schema.path) {
      if(typeof step === 'object') {
        if(step.path) {
          const value = get(source, step.path);
          if(Array.isArray(value)) {
            results = results.concat(value);
          } else {
            results.push(String(value));
          }
        }
      } else {
        results.push(step);
      }
    }
    return results.join('/');
  }

  parse(
    route: ResolvedRoute,
    defaults: Record<string, unknown>,
  ): Record<string, unknown> {
    const result = cloneDeep(defaults) as Record<string, unknown>;
    const routeTokens = route.path.slice();
    for(const step of this.schema.path) {
      if(typeof step === 'string') {
        routeTokens.shift();
      } else {
        if(step.asArray) {
          if(step.types) {
            const types = step.types;
            const values = routeTokens.map(
              token => destringify(token, types)
            );
            set(result, step.path, values);
          } else {
            set(result, step.path, routeTokens);
          }
          break;
        }
        const token = routeTokens.shift();
        if(token) {
          if(step.types) {
            const value = destringify(token, step.types);
            set(result, step.path, value);
          } else {
            set(result, step.path, token);
          }
        }
      }
    }
    return result;
  }

  createHRef(values?: Record<string, unknown>): string {
    let href = this.schema.hash ? '#' : '';
    for(const step of this.schema.path) {
      if(typeof step === 'object') {
        const value = get(values, step.path, '');
        if(Array.isArray(value)) {
          href += `/${value.join('/')}`;
        } else {
          href += `/${String(value)}`;
        }
      } else {
        href += `/${step}`;
      }
    }
    return href;
  }
}

export function destringify(
  source: string,
  types: string,
): unknown {
  const typeMap: Record<string, boolean> = {};
  types.split('|').forEach(term => typeMap[term] = true);
  if(typeMap.number) {
    const asNumber = Number(source);
    if(isNaN(asNumber) && typeMap.string) {
      return source;
    }
    return asNumber;
  }
  return source;
}
