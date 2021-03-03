import * as React from 'react';

export interface TContext {
  state: string;
}

export interface TAction {
  type: string;
}

export type TEffect<C extends TContext> = (state: C) => void | (() => void);

export type PickState<C extends { state: string }, SS extends C['state']> = C extends { state: SS } ? C : never;

export type PickAction<E extends { type: string }, T extends E['type']> = E extends { type: T } ? E : never;

export type TTransitions<C extends TContext, A extends TAction> = {
  [State in C['state']]: {
    [Type in A['type']]?: (
      action: A extends { type: Type } ? A : never,
      state: C extends { state: State } ? C : never,
    ) => C;
  };
};

export type TEffects<C extends TContext> = {
  [State in C['state']]?:
    | TEffect<C extends { state: State } ? C : never>
    | Array<TEffect<C extends { state: State } ? C : never>>;
};

export type TTransforms<C extends TContext> =
  | C['state']
  | {
      [State in C['state']]?: (state: C extends { state: State } ? C : never) => any;
    };

export const transition = <C extends TContext, A extends TAction>(
  state: C,
  action: A,
  transitions: TTransitions<C, A>,
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
      Array.isArray(effects[state.state])
      ? // @ts-ignore
        effects[state.state].reduce((dispose, effect) => {
          const result = effect(state);

          return () => {
            if (dispose) {
              dispose();
            }
            if (result) {
              result();
            }
          };
        }, undefined)
      : // @ts-ignore
        effects[state.state](state)
    : undefined;

export const transform = <C extends TContext>(
  state: C,
  transforms: TTransforms<C>,
  // @ts-ignore
) => (transforms[state.state] ? transforms[state.state](state) : null);

export const useStates = <C extends TContext, A extends TAction>(
  transitions: {
    [State in C['state']]: {
      [Type in A['type']]?: (
        action: A extends { type: Type } ? A : never,
        state: C extends { state: State } ? C : never,
      ) => C;
    };
  },
  initialState: C,
) => {
  const [context, dispatch] = React.useReducer(
    (state: C, action: A) => transition(state, action, transitions),
    initialState,
  );

  return {
    context,
    dispatch,
    exec: (effects: TEffects<C>) => exec(context, effects),
    transform: (transforms: TTransforms<C>) => transform(context, transforms),
  };
};
