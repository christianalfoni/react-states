export type TState = {
  state: string;
};

export type TAction = {
  type: string;
};

export type TEffect<S extends TState> = (state: S) => void | (() => void);

export const transition = <S extends TState, A extends TAction, NewState extends S['state']>(
  state: S,
  action: A,
  transitions: {
    [State in S['state']]: {
      [Type in A['type']]?: (
        action: A extends { type: Type } ? A : never,
        state: S extends { state: State } ? S : never,
      ) => S extends { state: NewState } ? S : never;
    };
  },
): S =>
  // @ts-ignore
  transitions[state.state] && transitions[state.state][action.type]
    ? // @ts-ignore
      transitions[state.state][action.type](action, state)
    : state;

export const exec = <S extends TState>(
  state: S,
  effects: {
    [State in S['state']]?:
      | TEffect<S extends { state: State } ? S : never>
      | TEffect<S extends { state: State } ? S : never>[];
  },
) =>
  // @ts-ignore
  effects[state.state]
    ? // @ts-ignore
      Array.isArray(effects[state.state])
      ? // @ts-ignore
        effects[state.state].reduce((dispose, effect) => {
          const result = effect(state);

          return () => {
            if (dispose) dispose();
            if (result) result();
          };
        }, undefined)
      : // @ts-ignore
        effects[state.state](state)
    : undefined;

export const transform = <S extends TState>(
  state: S,
  renders:
    | S['state']
    | {
        [State in S['state']]?: (state: S extends { state: State } ? S : never) => any;
      },
  // @ts-ignore
) => (renders[state.state] ? renders[state.state](state) : null);
