import * as React from 'react';

export * from './result';

export const IS_ACTION_IGNORED = Symbol('IS_ACTION_IGNORED');

export interface TContext {
  state: string;
}

export interface TAction {
  type: string | symbol;
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

export type TMap<C extends TContext> = {
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
  map: <T extends TMap<Context>>(
    transforms: T,
  ) => {
    [K in keyof T]: T[K] extends () => infer R ? R : never;
  }[keyof T];
  is: <S extends Context['state']>(state: S) => this is States<PickState<Context, S>, Action>;
  when: <S extends Context['state']>(state: S) => States<PickState<Context, S>, Action>;
}

export const transition = <C extends TContext, A extends TAction, NewState extends C['state']>(
  state: C,
  action: A,
  transitions: TTransitions<C, A, NewState>,
): C => {
  // @ts-ignore
  if (transitions[state.state] && transitions[state.state][action.type]) {
    // @ts-ignore
    return transitions[state.state][action.type](action, state);
  } else {
    // @ts-ignore
    action[IS_ACTION_IGNORED] = true;
  }

  return state;
};

export const exec = <C extends TContext>(state: C, effects: TEffects<C>) =>
  // @ts-ignore
  effects[state.state]
    ? // @ts-ignore
      effects[state.state](state)
    : undefined;

export const map = <C extends TContext, T extends TMap<C>>(
  context: C,
  map: T,
): {
  [K in keyof T]: T[K] extends () => infer R ? R : never;
  // @ts-ignore
}[keyof T] => (map[context.state] ? map[context.state](context) : null);

export const TRANSITIONS = Symbol('TRANSITIONS');

export const useStates = <C extends TContext, A extends TAction>(
  transitions: TUseStatesTransitions<C, A>,
  initialState: C,
): States<C, A> => {
  const reducer = React.useReducer((state: C, action: A) => transition(state, action, transitions), initialState);
  const whens = React.useRef<
    {
      [S in C['state']]?: any[];
    }
  >({});

  const context = reducer[0];

  const states: States<C, A> = React.useMemo(
    () => ({
      [TRANSITIONS]: transitions,
      context,
      dispatch: reducer[1],
      exec: effects => exec(context, effects),
      map: transforms => map(context, transforms),
      is(state) {
        if (this.context.state === state) {
          return true;
        }

        return false;
      },
      when(state) {
        if (this.context.state === state) {
          return this;
        }

        const promise = new Promise<States<PickState<C, typeof state>, A>>(resolve => {
          if (!whens.current[state]) {
            whens.current[state] = [];
          }

          whens.current[state]!.push(resolve);
        });

        let status = 'pending';
        let result: any;
        let suspender = promise.then(
          r => {
            status = 'success';
            result = r;
          },
          e => {
            status = 'error';
            result = e;
          },
        );

        if (status === 'pending') {
          throw suspender;
        } else if (status === 'error') {
          throw result;
        }

        return result;
      },
    }),
    [context],
  );

  React.useEffect(() => {
    const matchedWhens = whens.current[context.state];
    if (matchedWhens) {
      const resolvers = matchedWhens.splice(0, matchedWhens.length);
      resolvers.forEach(resolve => resolve(states));
    }
  }, [context]);

  return states;
};
