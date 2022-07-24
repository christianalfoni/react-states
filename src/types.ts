import { $ACTION, $TRANSITIONS } from './constants';

export interface IState {
  state: string;
  [$ACTION]?: IAction;
  [$TRANSITIONS]?: TReadableTransition<any>;
}

export interface IAction {
  type: string;
}

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
    state: Readonly<S & { state: SS }>,
    action: A extends { type: AA } ? Readonly<A> : never,
  ) => Readonly<S>;
};

export type TTransitions<S extends IState, A extends IAction> = {
  [SS in S['state']]: TTransition<S, A, SS>;
};

export type TReadableTransition<T extends TTransitions<any, any>> = {
  [S in keyof T]: {
    [A in keyof T[S]]: S extends string
      ? A extends string
        ? T[S][A] extends (...args: any[]) => IState
          ? `${S} => ${A} => ${ReturnType<T[S][A]>['state']}`
          : never
        : never
      : never;
  }[keyof T[S]];
}[keyof T];
