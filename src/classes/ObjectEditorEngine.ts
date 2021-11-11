import OperationEngine, { OperationRequest, OperationHandler } from '@/classes/OperationEngine'
import ValueChangeDescription from '@/interfaces/ValueChangeDescription'

export type PathStep = (string | number);

export type ValueMap = {[k in PathStep]: unknown};

export class SetValueRequest<T> implements OperationRequest {
  type = 'set';
  value?: T;
  previousValue?: T;
  path?: PathStep[];

  constructor(change?: ValueChangeDescription<T>) {
    if(change) {
      this.value = change.value;
      this.previousValue = change.previousValue;
      this.path = change.path;
    }
  }

  static defaultHandler: OperationHandler<unknown> = {
    apply(request: SetValueRequest<unknown>, target: unknown): unknown {
      if(request) {
        if(request.path) {
          const owner = ObjectEditorEngine.getValueOwner(target, request.path);
          if(owner) {
            const key = request.path[request.path.length - 1];
            owner[key] = request.value;
          }
        } else if(target) {
          const targetObject = target as ValueMap;
          if(request.value) {
            const sourceObject = request.value as ValueMap
            for(const key in targetObject) {
              if(key in sourceObject) continue;
              delete targetObject[key];
            }
            for(const key in sourceObject) {
              targetObject[key] = sourceObject[key];
            }
          } else {
            for(const key in targetObject) {
              delete targetObject[key];
            }
          }
        }
      }
      return target;
    },
    undo(request: SetValueRequest<unknown>, target: unknown): unknown {
      if(request) {
        return SetValueRequest.defaultHandler.apply(
          new SetValueRequest({
            value: request.previousValue,
            previousValue: request.value,
            path: request.path,
          }),
          target
        );
      }
      return target;
    },
  }
}

export class InsertValueRequest<T> implements OperationRequest {
  type = 'insert';
  path?: PathStep[];
  value?: T;

  constructor(path?: PathStep[], value?: T) {
    this.path = path;
    this.value = value;
  }

  static defaultHandler: OperationHandler<unknown> = {
    apply(request: InsertValueRequest<unknown>, target: unknown): unknown {
      if(request && request.path) {
        const owner = ObjectEditorEngine.getValueOwner(target, request.path);
        if(owner) {
          const key = request.path[request.path.length - 1];
          if(Array.isArray(owner) && typeof key === 'number') {
            owner.splice(key, 0, request.value);
          } else {
            owner[key] = request.value;
          }
        }
      }
      return target;
    },
    undo(request: InsertValueRequest<unknown>, target: unknown): unknown {
      if(request && request.path) {
        const owner = ObjectEditorEngine.getValueOwner(target, request.path);
        if(owner) {
          const key = request.path[request.path.length - 1];
          const index = Number(key);
          if(Array.isArray(owner) && !isNaN(index)) {
            owner.splice(index, 1);
          } else {
            if(key in owner) {
              delete owner[key];
            }
          }
        }
      }
      return target;
    },
  }
}

export class DeleteValueRequest<T> implements OperationRequest {
  type = 'delete';
  path?: PathStep[];
  value?: T;

  constructor(path?: PathStep[], value?: T) {
    this.path = path;
    this.value = value;
  }

  static defaultHandler: OperationHandler<unknown> = {
    apply(request: DeleteValueRequest<unknown>, target: unknown): unknown {
      return InsertValueRequest.defaultHandler.undo(request, target);
    },
    undo(request: DeleteValueRequest<unknown>, target: unknown): unknown {
      return InsertValueRequest.defaultHandler.apply(request, target);
    },
  }
}

export default class ObjectEditorEngine extends OperationEngine<unknown> {
  constructor() {
    super();
    this.handlers = {
      delete: { ...DeleteValueRequest.defaultHandler},
      insert: { ...InsertValueRequest.defaultHandler},
      set: { ...SetValueRequest.defaultHandler},
    };
  }

  static getValueOwner(source: unknown, path: PathStep[]): ValueMap | undefined {
    if(typeof source === 'object') {
      let target = source as ValueMap;
      const maxIndex = path.length - 2;
      for(let i = 0; i <= maxIndex; i++) {
        const step = path[i];
        if(target && typeof target[step] === 'object') {
          target = target[step] as ValueMap;
        } else {
          return undefined;
        }
      }
      return target;
    }
  }
}
