export default interface ValueChangeDescription<T> {
  value: T;
  previousValue?: T;
  path?: (string | number)[];
}
