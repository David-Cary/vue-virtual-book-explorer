import {
  Route,
  RouteConfig
} from 'vue-router'
import RouteDataParser, {
  RouteSchema,
} from '@/ts/utilities/RouteDataParser'
import { set, cloneDeep } from 'lodash'

export default class VueRouteLinker {
  parser: RouteDataParser;
  defaults: Partial<RouteConfig>;

  constructor(schema: RouteSchema, defaults: Partial<RouteConfig>) {
    this.parser = new RouteDataParser(schema);
    this.defaults = defaults;
  }

  get config(): RouteConfig {
    const config = cloneDeep(this.defaults) as RouteConfig;
    config.path = this.configPath;
    config.props = (route: Route) => this.getPropsFor(route);
    set(
      config,
      ['meta', 'createHRef'],
      (values?: Record<string, unknown>) => this.parser.createHRef(values)
    );
    set(
      config,
      ['meta', 'getPropsFor'],
      (route: Route) => this.getPropsFor(route)
    );
    return config;
  }

  get configPath(): string {
    let result = '';
    for(const step of this.parser.schema.path) {
      if(typeof step === 'object') {
        if(step.asArray) {
          result += '/*';
        } else {
          result += step.name
            ? `/:${step.name}`
            : '/*';
        }
      } else {
        result += `/${step}`;
      }
    }
    return result;
  }

  getPropsFor(route: Route): Record<string, unknown> {
    let results: Record<string, unknown> = {};
    // Start by applying defaults.
    if(this.defaults.props) {
      switch (typeof this.defaults.props) {
        case 'object': {
          Object.assign(results, this.defaults.props);
          break;
        }
        case 'function': {
          results = this.defaults.props(route);
          break;
        }
      }
    }
    // Then modify by any references in the described link path.
    const routeSteps = route.path.split('/');
    if(routeSteps.length && !routeSteps[0]) {
      routeSteps.shift();
    }
    results = this.parser.parse(
      {
        path: routeSteps
      },
      results,
    );
    return results;
  }
}
