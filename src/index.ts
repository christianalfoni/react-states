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
  [State in C['state']]?:
    | TEffect<C extends { state: State } ? C : never>
    | Array<TEffect<C extends { state: State } ? C : never>>;
};

export type TTransforms<C extends TContext> =
  | C['state']
  | {
      [State in C['state']]?: (state: C extends { state: State } ? C : never) => any;
    };

export type PickState<C extends { state: string }, SS extends C['state']> = C extends { state: SS } ? C : never;

export type PickAction<E extends { type: string }, T extends E['type']> = E extends { type: T } ? E : never;

export interface States<Context extends TContext, Action extends TAction> {
  context: Context;
  dispatch: React.Dispatch<Action>;
  exec: (effects: TEffects<Context>) => void | (() => void);
  transform: (transforms: TTransforms<Context>) => any;
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
      ) => C extends { state: C['state'] } ? C : never;
    };
  },
  initialState: C,
) => {
  const reducer = React.useReducer((state: C, action: A) => transition(state, action, transitions), initialState);

  return React.useMemo(
    (): States<C, A> => ({
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
