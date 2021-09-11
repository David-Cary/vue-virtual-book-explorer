import OperationEngine, { OperationRequest, OperationHandler } from '@/classes/OperationEngine'
import ValueChangeDescription from '@/interfaces/ValueChangeDescription'
import { set } from 'lodash'

export type ValueMap = {[k: string]: unknown};

export class SetValueRequest<T> implements OperationRequest {
  type = 'set';
  value?: T;
  previousValue?: T;
  path?: (string | number)[];

  constructor(change?: ValueChangeDescription<T>) {
    if(change) {
      this.value = change.value;
      this.previousValue = change.previousValue;
      this.path = change.path;
    }
  }

  static defaultHandler: OperationHandler<ValueMap> = {
    apply(request: SetValueRequest<ValueMap>, target: ValueMap): ValueMap {
      if(request && request.path) {
        set(target, request.path, request.value);
      }
      return target;
    },
    undo(request: SetValueRequest<ValueMap>, target: ValueMap): ValueMap {
      if(request && request.path) {
        set(target, request.path, request.previousValue);
      }
      return target;
    },
  }
}

export default class ObjectEditorEngine extends OperationEngine<ValueMap> {
  constructor() {
    super();
    this.handlers = {
      set: SetValueRequest.defaultHandler,
    };
  }
}
