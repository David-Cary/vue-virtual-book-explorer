import OperationEngine, { OperationRequest, OperationHandler } from '@/ts/data/OperationEngine'
import ValueChangeDescription from '@/ts/data/ValueChangeDescription'

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
        InsertValueRequest.insertValueAt(target, request.path, request.value);
      }
      return target;
    },
    undo(request: InsertValueRequest<unknown>, target: unknown): unknown {
      if(request && request.path) {
        DeleteValueRequest.deleteValueAt(target, request.path);
      }
      return target;
    },
  }

  static insertValueAt(
    target: unknown,
    path: PathStep[],
    value: unknown,
  ): void {
    const owner = ObjectEditorEngine.getValueOwner(target, path);
    if(owner) {
      const key = path[path.length - 1];
      if(Array.isArray(owner) && typeof key === 'number') {
        owner.splice(key, 0, value);
      } else {
        owner[key] = value;
      }
    }
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
      if(request && request.path) {
        DeleteValueRequest.deleteValueAt(target, request.path);
      }
      return target;
    },
    undo(request: DeleteValueRequest<unknown>, target: unknown): unknown {
      if(request && request.path) {
        InsertValueRequest.insertValueAt(target, request.path, request.value);
      }
      return target;
    },
  }

  static deleteValueAt(target: unknown, path: PathStep[]): unknown {
    const owner = ObjectEditorEngine.getValueOwner(target, path);
    if(owner) {
      const key = path[path.length - 1];
      const index = Number(key);
      const value = owner[key];
      if(Array.isArray(owner) && !isNaN(index)) {
        owner.splice(index, 1);
      } else {
        if(key in owner) {
          delete owner[key];
        }
      }
      return value;
    }
  }
}

export class RelocateValueRequest implements OperationRequest {
  type = 'relocate';
  from?: PathStep[];
  to?: PathStep[];

  constructor(from?: PathStep[], to?: PathStep[]) {
    this.from = from;
    this.to = to;
  }

  static defaultHandler: OperationHandler<unknown> = {
    apply(request: RelocateValueRequest, target: unknown): unknown {
      if(request.from && request.to) {
        RelocateValueRequest.relocateValue(target, request.from, request.to);
      }
      return target;
    },
    undo(request: RelocateValueRequest, target: unknown): unknown {
      if(request.from && request.to) {
        RelocateValueRequest.relocateValue(target, request.to, request.from);
      }
      return target;
    },
  }

  static relocateValue(
    target: unknown,
    from: PathStep[],
    to: PathStep[],
  ): void {
    const value = DeleteValueRequest.deleteValueAt(target, from);
    const updatedPath = RelocateValueRequest.getPostDeletionPath(to, from);
    InsertValueRequest.insertValueAt(target, updatedPath, value);
  }

  static getPostDeletionPath(
    source: PathStep[],
    deletion: PathStep[],
  ): PathStep[] {
    const result = source.slice();
    if(source.length >= deletion.length) {
      const finalIndex = deletion.length - 1;
      for(let i = 0; i < finalIndex; i++) {
        if(source[i] !== deletion[i]) {
          return result;
        }
      }
      const sourceKey = source[finalIndex];
      const deletionKey = deletion[finalIndex];
      if(typeof sourceKey === 'number'
        && typeof deletionKey === 'number'
        && deletionKey <= sourceKey
      ) {
        result[finalIndex] = sourceKey - 1;
      }
    }
    return result;
  }
}

export default class ObjectEditorEngine extends OperationEngine<unknown> {
  constructor() {
    super();
    this.handlers = {
      delete: { ...DeleteValueRequest.defaultHandler},
      insert: { ...InsertValueRequest.defaultHandler},
      set: { ...SetValueRequest.defaultHandler},
      relocate: { ...RelocateValueRequest.defaultHandler},
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

  static getValue(source: unknown, path: PathStep[]): unknown {
    if(typeof source === 'object') {
      let target: unknown = source;
      for(let i = 0; i < path.length; i++) {
        const step = path[i];
        if(typeof target === 'object' && target) {
          target = (target as ValueMap)[step];
        } else {
          return undefined;
        }
      }
      return target;
    }
  }
}
