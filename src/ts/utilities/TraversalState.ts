// Key types.

export type CommonKey = string | number;

export type ValidKey = CommonKey | symbol;

// Interfaces for accessing object values as data tree nodes.

export type ForEachCallback<P, K, C> = (
  child: C,
  key: K,
  parent: P,
) => void;

export class NodeStrategy<R, K extends ValidKey = ValidKey, N = R> {
  getChild(
    source: R | N,
    key: K,
  ): N | undefined {
    if(typeof source === 'object' && source) {
      if(Array.isArray(source) && typeof key === 'number') {
        return source[key];
      }
      const record = source as unknown as Record<K, N>;
      if(key in record) {
        return record[key];
      }
    }
  }
  getKey(
    source: R | N,
    index: number,
  ): ValidKey | undefined {
    if(typeof source === 'object' && source) {
      if(Array.isArray(source)) {
        return wrapArrayIndex(source, index);
      }
      const keys = Object.keys(source);
      const wrappedIndex = wrapArrayIndex(keys, index);
      return keys[wrappedIndex];
    }
  }
  getOffsetKey(
    source: R | N,
    key: ValidKey,
    offset: number,
  ): ValidKey | undefined {
    if(typeof source === 'object' && source) {
      if(Array.isArray(source)) {
        if(typeof key === 'number') {
          return key + offset;
        }
      } else if(typeof key === 'string') {
        const keys = Object.keys(source);
        const index = keys.indexOf(key);
        if(index >= 0) {
          return keys[index + offset];
        }
      }
    }
  }
  keyCount(
    source: R | N,
  ): ValidKey | undefined {
    if(typeof source === 'object' && source) {
      if(Array.isArray(source)) {
        return source.length;
      }
      const keys = Object.keys(source);
      return keys.length;
    }
  }
  forEach(
    source: R | N,
    callback: ForEachCallback<unknown, CommonKey, N>,
  ): void {
    if(typeof source === 'object' && source) {
      if(Array.isArray(source)) {
        source.forEach(callback);
      } else {
        const record = source as unknown as Record<K, N>;
        for(const key in record) {
          callback(record[key], key, record);
        }
      }
    }
  }
}

export function wrapArrayIndex(source: unknown[], index: number): number {
  if(index >= 0) {
    index;
  }
  const count = source.length;
  return count + index;
}

// Interfaces for tracking the traversal's state.

export interface IndexedValue<T, K extends ValidKey = ValidKey> {
  key: K,
  value: T,
}

export interface TraversalState<R, K extends ValidKey = ValidKey, N = R> {
  root: R;
  descent: IndexedValue<N | undefined, K>[];
}

export function cloneTraversal<R, K extends ValidKey, N = R>(
  source: TraversalState<R, K, N>,
): TraversalState<R, K, N> {
  return {
    root: source.root,
    descent: source.descent.slice(),
  };
}

// Basic traversal functions.

export type VisitNodeCallback<R, K extends ValidKey = ValidKey, N = R> = (
  node: N,
  stack: TraversalState<R, K, N>,
  strategy: NodeStrategy<R, K, N>,
) => boolean | void;

export interface TraversalOptions<R, K extends ValidKey = ValidKey, N = R> {
  preOrder: VisitNodeCallback<R, K, N>;
  postOrder: VisitNodeCallback<R, K, N>;
}

/**
 * Handles traversing a given object as part of a data tree.
 */
export function traverseTree<T>(
  root: T,
  options: Partial<TraversalOptions<T, ValidKey>>,
  strategy: NodeStrategy<T, ValidKey> = new NodeStrategy(),
): void {
  const state: TraversalState<T, ValidKey> = {
    root,
    descent: [],
  };
  if(options?.preOrder) {
    const signal = options.preOrder(root, state, strategy);
    if(signal === false) {
      return;
    }
  }
  strategy.forEach(
    root,
    (value, key) => extendTraversal(
      state,
      { key, value: value as T },
      options,
      strategy,
    ),
  );
  if(options?.postOrder) {
    options.postOrder(root, state, strategy);
  }
}

/**
 * Handles traversing a collection of nodes.
 */
export function traverseContents<R, N>(
  root: R,
  options: Partial<TraversalOptions<R, ValidKey, N>>,
  strategy: NodeStrategy<R, ValidKey, N> = new NodeStrategy(),
): void {
  const state: TraversalState<R, ValidKey, N> = {
    root,
    descent: [],
  };
  strategy.forEach(
    root,
    (value, key) => extendTraversal(
      state,
      { key, value },
      options,
      strategy,
    ),
  );
}

/**
 * Helper function for fleshing out a traversal after the root is established.
 */
export function extendTraversal<R, N>(
  state: TraversalState<R, ValidKey, N>,
  entry: IndexedValue<N, ValidKey>,
  options: Partial<TraversalOptions<R, ValidKey, N>>,
  strategy: NodeStrategy<R, ValidKey, N> = new NodeStrategy(),
): void {
  state.descent.push(entry);
  if(options?.preOrder) {
    const signal = options.preOrder(entry.value, state, strategy);
    if(signal === false) {
      return;
    }
  }
  strategy.forEach(
    entry.value,
    (value, key) => extendTraversal(
      state,
      { key, value },
      options,
      strategy,
    ),
  );
  if(options?.postOrder) {
    options.postOrder(entry.value, state, strategy);
  }
  state.descent.pop();
}

/**
 * Returns the value and steps taken trying to retrive a value by it's path.
 */
export function getNestedValue<R, K extends ValidKey = ValidKey, N = R>(
  root: R,
  path: K[],
  strategy: NodeStrategy<R, K, N> = new NodeStrategy(),
  defaultValue?: N,
): DescentResult<R, K, N> {
  const state: TraversalState<R, K, N> = {
    root,
    descent: [],
  };
  extendDescent(state, path, strategy);
  return new DescentResult(state, strategy, defaultValue);
}

/**
 * Helper function for fleshing out a traversal after the root is established.
 */
export function extendDescent<R, K extends ValidKey, N>(
  state: TraversalState<R, K, N>,
  path: K[],
  strategy: NodeStrategy<R, K, N> = new NodeStrategy(),
): void {
  let lastEntry = state.descent.length
    ? state.descent[state.descent.length - 1]
    : null;
  for(let i = 0; i < path.length; i++) {
    const parent = lastEntry ? lastEntry.value : state.root;
    if(parent !== undefined) {
      const key = path[i];
      const value = strategy.getChild(parent, key);
      lastEntry = { key, value };
      state.descent.push(lastEntry);
    } else {
      break;
    }
  }
}

/**
 * Returns the value and steps taken trying to retrive a value by it's path.
 */
export function getLeaf<R, K extends ValidKey = ValidKey, N = R>(
  root: R,
  keyIndex: number,
  strategy: NodeStrategy<R, K, N> = new NodeStrategy(),
  start?: IndexedValue<N | undefined, K>[],
): DescentResult<R, K, N> {
  const state: TraversalState<R, K, N> = {
    root,
    descent: start ? start.slice() : [],
  };
  let count: number;
  do {
    count = state.descent.length;
    const finalValue = state.descent[count - 1].value;
    if(finalValue !== undefined) {
      const key = strategy.getKey(finalValue, keyIndex);
      if(key !== undefined) {
        extendDescent(state, [key], strategy);
      }
    } else {
      break;
    }
  } while(state.descent.length > count)
  const lastEntry = state.descent[count - 1];
  if(lastEntry && lastEntry.value === undefined) {
    state.descent.pop();
  }
  return new DescentResult(state, strategy);
}

/**
 * Utility class for the results of trying to find a nested value.
 */
export class DescentResult<R, K extends ValidKey = ValidKey, N = R> {
  readonly state: TraversalState<R, K, N>;
  readonly strategy?: NodeStrategy<R, K, N>;
  readonly defaultValue?: N;

  constructor(
    state: TraversalState<R, K, N>,
    strategy?: NodeStrategy<R, K, N>,
    defaultValue?: N,
  ) {
    this.state = state;
    this.strategy = strategy;
    this.defaultValue = defaultValue;
  }

  get ancestors(): (R | N)[] {
    const nodes: (R | N)[] = [ this.state.root ];
    const maxIndex = this.state.descent.length - 1;
    for(let i = 0; i < maxIndex; i++) {
      const entry = this.state.descent[i];
      if(entry.value !== undefined) {
        nodes.push(entry.value);
      }
    }
    return nodes;
  }

  get content(): N[] {
    const nodes: N[] = [];
    for(let i = 0; i < this.state.descent.length; i++) {
      const entry = this.state.descent[i];
      if(entry.value !== undefined) {
        nodes.push(entry.value);
      }
    }
    return nodes;
  }

  get finalEntry(): IndexedValue<N | undefined, K> | null {
    const count = this.state.descent.length;
    if(count) {
      return this.state.descent[count - 1];
    }
    return null;
  }

  get nodes(): (R | N)[] {
    const nodes: (R | N)[] = this.content;
    nodes.unshift(this.state.root);
    return nodes;
  }

  get path(): K[] {
    return this.state.descent.map(entry => entry.key);
  }

  get value(): N | undefined {
    const entry = this.finalEntry;
    return entry?.value !== undefined ? entry.value : this.defaultValue;
  }

  getNestedValue(path: K[]): DescentResult<R, K, N> {
    const substate = cloneTraversal(this.state);
    extendDescent(
      substate,
      path,
      this.strategy,
    );
    return new DescentResult(substate, this.strategy);
  }

  static clone<R, K extends ValidKey, N>(
    source: DescentResult<R, K, N>,
  ): DescentResult<R, K, N> {
    const state = cloneTraversal(source.state);
    return new DescentResult(state, source.strategy, source.defaultValue);
  }
}

// Descent iteration functions.

export interface DescentStep<R, K, N = R> {
  depth: number,
  source: R | N,
  key: K,
  value: N | undefined,
}

export function getDescentStep<R, K extends ValidKey, N>(
  source: TraversalState<R, K, N>,
  depth: number,
): DescentStep<R, K, N> | null {
  const entry = source.descent[depth];
  if(entry) {
    return {
      depth,
      source: depth > 0
        ? source.descent[depth - 1].value as N
        : source.root,
      key: entry.key,
      value: entry.value,
    }
  }
  return null;
}

export type DescentIterationCallback<R, K, N = R> = (
  step: DescentStep<R, K, N>,
) => boolean | void;

export function repeatDescent<R, K extends ValidKey, N>(
  source: TraversalState<R, K, N>,
  callback: DescentIterationCallback<R, K, N>,
): void {
  for(let i = 0; i < source.descent.length; i++) {
    const step = getDescentStep(source, i);
    if(step) {
      const signal = callback(step);
      if(signal === false) {
        break;
      }
    } else {
      break;
    }
  }
}

export function reverseDescent<R, K extends ValidKey, N>(
  source: TraversalState<R, K, N>,
  callback: DescentIterationCallback<R, K, N>,
): void {
  for(let i = source.descent.length - 1; i >= 0; i--) {
    const step = getDescentStep(source, i);
    if(step) {
      const signal = callback(step);
      if(signal === false) {
        break;
      }
    } else {
      break;
    }
  }
}

/**
 * Retrieves sibling of target node.
 */
export function getSibling<R, K extends ValidKey, N>(
  source: TraversalState<R, K, N>,
  offset: number,
  strategy: NodeStrategy<R, K, N> = new NodeStrategy(),
  ascend = false,
): DescentResult<R, K, N> | null {
  let result: DescentResult<R, K, N> | null = null;
  reverseDescent(
    source,
    step => {
      const key = strategy.getOffsetKey(
        step.source,
        step.key,
        offset,
      );
      if(key !== undefined) {
        const state: TraversalState<R, K, N> = {
          root: source.root,
          descent: source.descent.slice(0, step.depth),
        };
        extendDescent(state, [key], strategy);
        if(state.descent[step.depth].value !== undefined) {
          result = new DescentResult(state, strategy);
          return false;
        }
      }
      return ascend;
    }
  );
  return result;
}

// Specialized node strategies.

export class WrappedArrayStrategy<R, N = R> extends
  NodeStrategy<R, number, N>
{
  getChildren: (source: R | N) => N[];

  constructor(
    getChildren: (source: R | N) => N[],
  ) {
    super();
    this.getChildren = getChildren;
  }
  getChild(
    source: R | N,
    index: number,
  ): N | undefined {
    const children = this.getChildren(source);
    return children[index];
  }
  getKey(
    source: R | N,
    index: number,
  ): number | undefined {
    const children = this.getChildren(source);
    return wrapArrayIndex(children, index);
  }
  getOffsetKey(
    source: R | N,
    key: number,
    offset: number,
  ): ValidKey | undefined {
    return key + offset;
  }
  keyCount(
    source: R | N,
  ): ValidKey | undefined {
    const children = this.getChildren(source);
    return children.length;
  }
  forEach(
    source: R | N,
    callback: ForEachCallback<R | N, number, N>,
  ): void {
    const children = this.getChildren(source);
    children.forEach(
      (child, index) => callback(child, index, source)
    );
  }
}
