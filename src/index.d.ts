declare const stonix: DefaultExports;

export default stonix;

export interface DefaultExports extends Function {
  <TLogic extends StoreLogic = DefaultStoreLogic>(
    logic: TLogic,
    options?: StoreOptions
  ): StoreLogicInfer<TLogic>;
  <TLogic extends StoreLogic = DefaultStoreLogic>(
    logic: [TLogic, ...StoreLogic[]],
    options?: StoreOptions
  ): StoreLogicInfer<TLogic>;
  loadable: LoadableExports;
}

export interface LoadableExports extends Function {
  <T = any>(defaultValue?: T): Loadable<T>;
  reducer(
    ...options: LoadableReducerForSpecifiedPropOptions[]
  ): (state: any, args?: ReducerArgs) => any;
  reducer(
    ...options: LoadableReducerOptions[]
  ): {
    [key: string]: (state: any, args?: ReducerArgs) => any;
  };
}

export interface ReducerArgs {
  action: ActionType;
  payload: any;
}

export interface LoadableReducerOptions {
  action?: ActionType;
  outdated?: boolean;
  state?: LoadableLoadingState | LoadableHasErrorState | LoadableHasValueState;
  result:
    | string
    | ((loadable?: Loadable<any>, state?: any, args?: ReducerArgs) => any);
}

export interface LoadableReducerForSpecifiedPropOptions
  extends LoadableReducerOptions {
  prop: string;
}

export interface StoreOptions {
  middleware?: Middleware | Middleware[];
  asyncMode?: AsyncMode;
  logic?: StoreLogic;
}

export interface Store<TState> {
  get(): TState;
  get<TProp extends KeyOf<TState>>(prop: TProp): TState[TProp];
  use<TLogic extends StoreLogic>(
    logic: TLogic
  ): StoreLogicInfer<TLogic & { state: TState }>;
  on(listener: Listener): RemoveListener;
  on(action: ActionType, listener: Listener): RemoveListener;
  call(action: ActionType, payload?: any): void;
  select<TValue = any>(selector: string, customState?: TState): TValue;
  select<TValue>(
    selector: (state: TState, props?: { [key: string]: any }) => TValue
  ): TValue;
}

export interface Loadable<T = any> {
  action: ActionType;
  readonly value: T;
  state: LoadableLoadingState | LoadableHasValueState | LoadableHasErrorState;
  error: any;
  tryGetValue(defaultValue?: T): T;
  promise: Promise<any>;
  outdated: boolean;
}

export interface FlowContext {
  when(...args: any[]): Flow;
  call(...args: any[]): Flow;
  pipe(...args: any[]): Flow;
  delay(...args: any[]): Flow;
  debounce(...args: any[]): Flow;
  latest(...args: any[]): Flow;
}

export interface EffectContext<TState = any> {
  action: ActionType;
  payload: any;
  delay<TValue>(ms: number, value?: TValue): Promise<TValue>;
  debounce<TFunction>(ms: number, fn: TFunction): TFunction;
  throttle<TFunction>(ms: number, fn: TFunction): TFunction;
  call(action: ActionType, payload?: any): void;
  get(): TState;
}

export interface StoreLogic {
  state?: any;
  on?: { change: Function; call: Function };
  select?: { [key: string]: Function | any[] };
  flow?(context: FlowContext): Flow | Flow[];
}

export interface Flow extends Function {}

export type DefaultStoreLogic = { state: {} };

export type LoadableHasValueState = "hasValue";

export type LoadableHasErrorState = "hasError";

export type LoadableLoadingState = "loading";

export type AsyncMode =
  | "default"
  | boolean
  | "dynamic"
  | { [key: string]: AsyncMode };

export type Middleware = (
  store: Store<any>
) => (
  next: (action: ActionType, payload?: any) => void
) => (action: ActionType, payload?: any) => any;

export type StoreLogicInfer<T> = StoreStateInfer<T> &
  StoreActionInfer<Omit<T, "state" | "flow" | "init" | "on">>;

export type StoreStateInfer<T> = T extends { state: infer TState }
  ? Store<TState>
  : never;

export type StoreActionInfer<T> = { [key in keyof T]: DispatcherInfer<T[key]> };

export type DispatcherInfer<T> = T extends (payload?: infer TPayload) => any
  ? Dispatcher<TPayload>
  : T extends Flow
  ? never
  : Dispatcher;

export type ActionType = string;

export type Dispatcher<T = any> = (payload?: T) => void;

export type RemoveListener = {};

export type Listener = () => any;

export type KeyOf<T> = keyof T;
