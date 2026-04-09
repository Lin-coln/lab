export interface Stream<T> extends AsyncIterable<T> {
  controller: AbortController;

  tee(): [Stream<T>, Stream<T>];
}
