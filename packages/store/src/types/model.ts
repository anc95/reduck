import { Context } from './app';

export type Action<State, Payload = any> = (
  state: State,
  payload: Payload,
  ...extraArgs: any[]
) => // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
State | void;

export interface Actions<State> {
  [key: string]: Action<State> | Actions<State>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ModelDescOptions {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ModelDesc<State = any, MDO extends ModelDescOptions = any> {
  /**
   * Unique name
   */
  name: string;
  /**
   * Model state
   */
  state: State;
  /**
   * Model actions, it's a pure function with no effect
   */
  actions?: Actions<State>;
}

export interface DispatchActions {
  [key: string]: ((payload: any) => void) | DispatchActions;
}

export type Model = {
  (name: string): any;
  _: Omit<ModelDesc, 'name'>;
  // model name
  _name?: string;
};

type Merge<T extends Record<string, any>, K extends string> = {
  [key in keyof T as K]: T[key];
};

type UnionToIntersection<U> = (
  U extends any ? (arg: U) => any : never
) extends (arg: infer I) => void
  ? I
  : never;

/**
 * GetActions
 * A type hook to resolve actions type from  Model
 */
export interface GetActions<M extends Model> {
  actions: ExtractDispatchActions<M['_']['actions']>;
}

/**
 * GetState
 * A type hook to resolve state type from  Model
 */
export interface GetState<M extends Model> {
  state: M['_']['state'];
}

export type MountedModel<M extends Model = Model> = {
  name: string;
  state: UnionToIntersection<Merge<GetState<M>, 'state'>['state']>;
  actions: UnionToIntersection<Merge<GetActions<M>, 'actions'>['actions']>;
  modelDesc: ModelDesc;
};

/**
 * Extract action dispatcher from  model actions define info
 * @example
 *
 * before
 * {
 *   actions: {
 *     a: (state: State, payload: string) => {}
 *   }
 * }
 *
 * after
 * {
 *   actions: {
 *     a: (state: State) => {};
 *   }
 * }
 */
type ExtractDispatchActions<A extends Actions<any> = Actions<any>> = {
  [key in keyof A]: A[key] extends Actions<any>
    ? ExtractDispatchActions<A[key]>
    : A[key] extends () => any
    ? () => void
    : A[key] extends (S: any, ...args: infer S) => any
    ? (...args: S) => void
    : never;
};

type ModelType = Model;

type GetModelsState<Models extends Model[]> = UnionToIntersection<
  MountedModel<Models[number]>['state']
>;

type GetModelsAction<Models extends Model[]> = UnionToIntersection<
  MountedModel<Models[number]>['actions']
>;

type GetModelsStateTuple<
  Models extends ModelType[],
  U extends any[] = [],
> = Models extends [infer Head, ...infer Tail]
  ? Head extends ModelType
    ? Tail extends ModelType[]
      ? GetModelsStateTuple<Tail, [...U, GetModelsState<[Head]>]>
      : [...U, GetModelsState<[Head]>]
    : U
  : U;

type GetModelsActionsTuple<
  Models extends ModelType[],
  U extends any[] = [],
> = Models extends [infer Head, ...infer Tail]
  ? Head extends ModelType
    ? Tail extends ModelType[]
      ? GetModelsActionsTuple<Tail, [...U, GetModelsAction<[Head]>]>
      : [...U, GetModelsAction<[Head]>]
    : U
  : U;

export interface UseModel {
  // useModel(aModel, bModel);
  <Models extends Model[]>(...models: Models): [
    GetModelsState<Models>,
    GetModelsAction<Models>,
    ReturnType<Context['apis']['getModelSubscribe']>,
  ];
  // useModel([AModel, BModel]);
  <Models extends Model[]>(models: [...Models]): [
    GetModelsState<Models>,
    GetModelsAction<Models>,
    ReturnType<Context['apis']['getModelSubscribe']>,
  ];
  // useModel(Amodel, BModel, ..., stateSelector, actionsSelector)
  <
    Models extends Model[],
    StateSelector extends (...args: GetModelsStateTuple<Models>) => any,
    ActionSelector extends (...args: GetModelsActionsTuple<Models>) => any,
  >(
    ...arg: [...models: Models, s?: StateSelector, a?: ActionSelector]
  ): [
    StateSelector extends (...args: any[]) => infer S ? S : never,
    ActionSelector extends (...args: any[]) => infer S ? S : never,
    ReturnType<Context['apis']['getModelSubscribe']>,
  ];
  // useModel(Amodel, BModel, ..., stateSelector)
  <
    Models extends Model[],
    StateSelector extends (...args: GetModelsStateTuple<Models>) => any,
  >(
    ...models: [...Models, StateSelector]
  ): [
    StateSelector extends (...args: any[]) => infer S ? S : never,
    GetModelsAction<Models>,
    ReturnType<Context['apis']['getModelSubscribe']>,
  ];
  // useModel([Amodel, BModel, ...], stateSelector, actionsSelector)
  <
    Models extends Model[],
    StateSelector extends (...args: GetModelsStateTuple<Models>) => any,
    ActionSelector extends (...args: GetModelsActionsTuple<Models>) => any,
  >(
    models: [...Models],
    s?: StateSelector,
    a?: ActionSelector,
  ): [
    StateSelector extends (...args: any[]) => infer S ? S : never,
    ActionSelector extends (...args: any[]) => infer S ? S : never,
    ReturnType<Context['apis']['getModelSubscribe']>,
  ];
  // useModel([Amodel, BModel, ...], stateSelector)
  <
    Models extends Model[],
    StateSelector extends (...args: GetModelsStateTuple<Models>) => any,
  >(
    models: [...Models],
    s?: StateSelector,
  ): [
    StateSelector extends (...args: any[]) => infer S ? S : never,
    GetModelsAction<Models>,
    ReturnType<Context['apis']['getModelSubscribe']>,
  ];
}

export type OnMountHook = (handler: () => void) => void;
