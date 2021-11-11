import Vue from 'vue'
import ObjectEditorEngine, {
  SetValueRequest,
  ValueMap,
  PathStep,
} from "@/classes/ObjectEditorEngine"
import { OperationHandler } from '@/classes/OperationEngine'

export default class VueObjectEditorEngine extends ObjectEditorEngine {
  constructor() {
    super();
    for(const key in VueObjectEditorEngine.defaultHandlers) {
      this.handlers[key] = { ...VueObjectEditorEngine.defaultHandlers[key] };
    }
  }

  static defaultHandlers: {[k: string]: OperationHandler<unknown>} = {
    set: {
      apply(request: SetValueRequest<unknown>, target: unknown): unknown {
        if(request) {
          if(request.path) {
            VueObjectEditorEngine.setNestedValue(
              target,
              request.path,
              request.value
            );
          } else if(target) {
            VueObjectEditorEngine.resetValuesOf(
              target,
              request.value as ValueMap
            );
          }
        }
        return target;
      },
      undo(request: SetValueRequest<unknown>, target: unknown): unknown {
        if(request) {
          if(request.path) {
            VueObjectEditorEngine.setNestedValue(
              target,
              request.path,
              request.previousValue
            );
          } else if(target) {
            VueObjectEditorEngine.resetValuesOf(
              target,
              request.previousValue as ValueMap
            );
          }
        }
        return target;
      },
    },
    insert: {
      apply(request: SetValueRequest<unknown>, target: unknown): unknown {
        if(request && request.path) {
          VueObjectEditorEngine.insertNestedValue(
            target,
            request.path,
            request.value
          );
        }
        return target;
      },
      undo(request: SetValueRequest<unknown>, target: unknown): unknown {
        if(request && request.path) {
          VueObjectEditorEngine.deleteNestedValue(
            target,
            request.path
          );
        }
        return target;
      },
    },
  };

  static deleteNestedValue(target: unknown, path: PathStep[]): void {
    if(target && typeof target === 'object') {
      const finalTarget = VueObjectEditorEngine.getValueOwner(
        target as ValueMap,
        path
      );
      if(finalTarget) {
        const finalStep = path[path.length - 1];
        if(Array.isArray(finalTarget) && typeof finalStep === 'number') {
          finalTarget.splice(finalStep, 1);
        } else {
          Vue.delete(finalTarget, finalStep);
        }
      }
    }
  }

  static getValueOwner(
    target: ValueMap,
    path: PathStep[]
  ): ValueMap | undefined {
    let currentTarget = target as ValueMap;
    const maxIndex = path.length - 1;
    for(let i = 0; i < maxIndex; i++) {
      const step = path[i];
      const nextTarget = currentTarget[step];
      if(nextTarget && typeof nextTarget === 'object') {
        currentTarget = nextTarget as ValueMap;
      } else {
        return undefined;
      }
    }
    return currentTarget;
  }

  static insertNestedValue(
    target: unknown,
    path: PathStep[],
    value: unknown
  ): void {
    if(target && typeof target === 'object') {
      const finalTarget = VueObjectEditorEngine.populateValueOwner(
        target as ValueMap,
        path
      );
      const finalStep = path[path.length - 1];
      if(Array.isArray(finalTarget) && typeof finalStep === 'number') {
        finalTarget.splice(finalStep, 0, value);
      } else {
        if(value === undefined) {
          Vue.delete(finalTarget, finalStep);
        } else {
          Vue.set(finalTarget, finalStep, value);
        }
      }
    }
  }

  static populateValueOwner(target: ValueMap, path: PathStep[]): ValueMap {
    let currentTarget = target as ValueMap;
    const maxIndex = path.length - 1;
    for(let i = 0; i < maxIndex; i++) {
      const step = path[i];
      let nextTarget = currentTarget[step];
      if(!nextTarget || typeof nextTarget !== 'object') {
        const nextStep = path[i + 1];
        nextTarget = typeof nextStep === 'number' ? [] : {};
        Vue.set(currentTarget, step, nextTarget);
      }
      currentTarget = nextTarget as ValueMap;
    }
    return currentTarget;
  }

  static setNestedValue(
    target: unknown,
    path: PathStep[],
    value: unknown
  ): void {
    if(target && typeof target === 'object') {
      const finalTarget = VueObjectEditorEngine.populateValueOwner(
        target as ValueMap,
        path
      );
      const finalStep = path[path.length - 1];
      if(value === undefined) {
        Vue.delete(finalTarget, finalStep);
      } else {
        Vue.set(finalTarget, finalStep, value);
      }
    }
  }

  static resetValuesOf(target: unknown, values: ValueMap): void {
    if(target && typeof target === 'object') {
      // Apply provided values.
      for(const key in values) {
        Vue.set(target, key, values[key]);
      }
      // Remove any values not covered.
      for(const key in target) {
        if(key in values) continue;
        Vue.delete(target, key);
      }
    }
  }
}
