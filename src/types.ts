import { $ACTION, $PREV_STATE, $TRANSITIONS } from './constants';

export interface StateChange {
  debugDispatch?: (action: IAction, isIgnored: boolean) => void;
  prevState?: IState;
  action?: IAction;
}

export interface IState {
  state: string;
  [$ACTION]?: IAction;
  [$PREV_STATE]?: IState;
  [$TRANSITIONS]?: TEvaluatedTransitions;
}

export interface IAction {
  type: string;
}

export type TEvaluatedTransitions = {
  [S: string]: {
    [A: string]: string;
  };
};

export type TMatch<S extends IState, R = any> = {
  [SS in S['state']]: (state: S & { state: SS }) => R;
};

export type TPartialMatch<S extends IState, R = any> = {
  [SS in S['state']]?: (state: S & { state: SS }) => R;
};

export type PickState<S extends IState, T extends S['state'] = never> = [T] extends [never]
  ? S
  : S extends { state: T }
  ? S
  : never;

export type PickAction<A extends IAction, T extends A['type']> = A extends {
  type: T;
}
  ? A
  : never;

export type TTransition<S extends IState, A extends IAction, SS extends S['state'] = S['state']> = {
  [AA in A['type']]?: (
    state: Readonly<S extends { state: SS } ? S : never>,
    action: Readonly<A extends { type: AA } ? A : never>,
  ) => Readonly<S>;
};

export type TTransitions<S extends IState, A extends IAction> = {
  [SS in S['state']]: TTransition<S, A, SS>;
};
