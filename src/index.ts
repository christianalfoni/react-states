import * as React from 'react';

export interface TContext {
  state: string;
}

export interface TAction {
  type: string;
}

export type TEffect<C extends TContext> = (state: C) => void | (() => void);

export type TTransitions<C extends TContext, A extends TAction, NewState extends C['state']> = {
  [State in C['state']]: {
    [Type in A['type']]?: (
      action: A extends { type: Type } ? A : never,
      state: C extends { state: State } ? C : never,
    ) => C extends { state: NewState } ? C : never;
  };
};

export type TEffects<C extends TContext> = {
  [State in C['state']]?: TEffect<C extends { state: State } ? C : never>;
};

export type TTransforms<C extends TContext> = {
  [State in C['state']]: (state: C extends { state: State } ? C : never) => any;
};

export type TUseStatesTransitions<C extends TContext, A extends TAction> = {
  [State in C['state']]: {
    [Type in A['type']]?: (
      action: A extends { type: Type } ? A : never,
      state: C extends { state: State } ? C : never,
    ) => C extends { state: C['state'] } ? C : never;
  };
};

export type PickState<C extends { state: string }, SS extends C['state']> = C extends { state: SS } ? C : never;

export type PickAction<E extends { type: string }, T extends E['type']> = E extends { type: T } ? E : never;

export interface States<Context extends TContext, Action extends TAction> {
  context: Context;
  dispatch: React.Dispatch<Action>;
  exec: (effects: TEffects<Context>) => void | (() => void);
  transform: <T extends TTransforms<Context>>(
    transforms: T,
  ) => {
    [K in keyof T]: T[K] extends () => infer R ? R : never;
  }[keyof T];
  is: <S extends Context['state']>(state: S) => this is States<PickState<Context, S>, Action>;
}

export const transition = <C extends TContext, A extends TAction, NewState extends C['state']>(
  state: C,
  action: A,
  transitions: TTransitions<C, A, NewState>,
): C =>
  // @ts-ignore
  transitions[state.state] && transitions[state.state][action.type]
    ? // @ts-ignore
      transitions[state.state][action.type](action, state)
    : state;

export const exec = <C extends TContext>(state: C, effects: TEffects<C>) =>
  // @ts-ignore
  effects[state.state]
    ? // @ts-ignore
      effects[state.state](state)
    : undefined;

export const transform = <C extends TContext, T extends TTransforms<C>>(
  context: C,
  transforms: T,
): {
  [K in keyof T]: T[K] extends () => infer R ? R : never;
  // @ts-ignore
}[keyof T] => (transforms[context.state] ? transforms[context.state](state) : null);

export const useStates = <C extends TContext, A extends TAction>(
  transitions: TUseStatesTransitions<C, A>,
  initialState: C,
): States<C, A> => {
  const reducer = React.useReducer((state: C, action: A) => transition(state, action, transitions), initialState);

  return React.useMemo(
    () => ({
      context: reducer[0],
      dispatch: reducer[1],
      exec: effects => exec(reducer[0], effects),
      transform: transforms => transform(reducer[0], transforms),
      is(state) {
        if (this.context.state === state) {
          return true;
        }

        return false;
      },
    }),
    [reducer[0]],
  );
};
