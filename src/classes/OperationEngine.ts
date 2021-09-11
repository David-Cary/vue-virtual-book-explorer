export interface OperationRequest {
  type: string;
}

export interface OperationHandler<T> {
  type?: string;
  apply: (request: OperationRequest, target: T) => T;
  undo?: (request: OperationRequest, target: T) => T;
}

export default class OperationEngine<T> {
  handlers: {[k: string]: OperationHandler<T>} = {};

  apply(script: OperationRequest[], target: T): T {
    if(script && this.handlers) {
      for(const step of script) {
        const handler = this.handlers[step.type];
        if(handler) {
          target = handler.apply(step, target);
        }
      }
    }
    return target;
  }
}
