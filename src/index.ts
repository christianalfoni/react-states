import React, { useContext, useReducer } from 'react';

export * from './result';

export const DEBUG_IS_EVENT_IGNORED = Symbol('DEBUG_IS_EVENT_IGNORED');
export const DEBUG_TRANSITIONS = Symbol('DEBUG_TRANSITIONS');
export const DEBUG_EXEC = Symbol('DEBUG_EXEC');

export interface TContext {
  state: string;
}

export interface TEvent {
  type: string | symbol;
}

export interface TTransitions {
  [state: string]: {
    [type: string]: Function;
  };
}

export type TEffect<C extends TContext> = (state: C) => void | (() => void);

export type TEffects<C extends TContext> = {
  [State in C['state']]?: TEffect<C extends { state: State } ? C : never>;
};

export type TMatch<C extends TContext> = {
  [State in C['state']]: (state: C extends { state: State } ? C : never) => any;
};

export type States<C extends TContext, E extends TEvent> = [C, React.Dispatch<E>];

export type PickContext<C extends { state: string }, SS extends C['state']> = C extends { state: SS } ? C : never;

export type PickEvent<E extends TEvent, T extends E['type']> = E extends { type: T } ? E : never;

export type Send<E extends TEvent> = (event: E) => void;

export function transition<C extends TContext, E extends TEvent>(
  context: C,
  event: E,
  transitions: {
    [State in C['state']]: {
      [Type in E['type']]?: (event: E & { type: Type }, context: C & { state: State }) => C;
    };
  },
) {
  let newContext = context;
  // @ts-ignore
  if (transitions[context.state] && transitions[context.state][event.type]) {
    // @ts-ignore
    newContext = transitions[context.state][event.type](event, context);
  } else {
    // @ts-ignore
    event[DEBUG_IS_EVENT_IGNORED] = true;
  }

  // @ts-ignore
  newContext[DEBUG_TRANSITIONS] = transitions;

  return newContext;
}

export function exec<C extends TContext>(context: C, effects: TEffects<C>) {
  // @ts-ignore
  if (effects[context.state]) {
    // @ts-ignore
    return context[DEBUG_EXEC] ? context[DEBUG_EXEC](effects[context.state]) : effects[context.state](context);
  }
}

export function match<C extends TContext, T extends TMatch<C>>(
  context: C,
  matches: T &
    {
      [K in keyof T]: K extends C['state'] ? T[K] : never;
    },
): {
  [K in keyof T]: T[K] extends () => infer R ? R : never;
}[keyof T] {
  // @ts-ignore This is an exhaustive check
  return matches[context.state](context);
}

export interface StatesHook<C extends TContext, E extends TEvent> {
  (): States<C, E>;
  <S extends C['state']>(state: S): States<C & { state: S }, E>;
}

export function createStatesReducer<C extends TContext, E extends TEvent>(
  transitions: {
    [State in C['state']]: {
      [Type in E['type']]?: (event: E & { type: Type }, context: C & { state: State }) => C;
    };
  },
) {
  return (context: C, event: E) => transition(context, event, transitions);
}

export function createStatesContext<C extends TContext, E extends TEvent>() {
  return React.createContext({} as States<C, E>);
}

export function createStatesHook<C extends TContext, E extends TEvent>(
  statesContext: React.Context<States<C, E>>,
): StatesHook<C, E> {
  return ((state: string) => {
    const states = useContext<States<C, E>>(statesContext);

    if (!state || states[0].state === state) {
      return states;
    }

    throw new Error(`You can not use "${state}" as the current state is "${states[0].state}"`);
  }) as any;
}

/*
  EXPERIMENTAL
*/
export interface ExperimentalStatesReducerHook<C extends TContext, E extends TEvent> {
  (): States<C, E>;
  <S extends C['state']>(state: S): States<C & { state: S }, E>;
  <S extends C['state'], O>(state: S, selector: (context: C & { state: S }) => O): [O, Send<E>];
}

interface StatesListener<C extends TContext, E extends TEvent> {
  (newTransitionsReducer: States<C, E>): void;
}
type StatesContext<C extends TContext, E extends TEvent> = States<C, E> & {
  subscribe: (listener: StatesListener<C, E>) => () => void;
};

export const createExperimentalStatesContext = <C extends TContext, E extends TEvent>() =>
  React.createContext({} as StatesContext<C, E>);

export const createExperimentalStatesHook = <C extends TContext, E extends TEvent>(
  transitionsReducerContext: React.Context<StatesContext<C, E>>,
): ExperimentalStatesReducerHook<C, E> => {
  return ((state?: string, selector?: (context: C) => any) => {
    const context = useContext<StatesContext<C, E>>(transitionsReducerContext);
    const [transitionsReducer, setTransitionsReducer] = React.useState<States<C, E>>(context);

    React.useEffect(
      () =>
        context.subscribe((newTransitionsReducer) => {
          if (!selector || selector(transitionsReducer[0]) !== selector(newTransitionsReducer[0])) {
            setTransitionsReducer(newTransitionsReducer);
          }
        }),
      [transitionsReducer],
    );

    if (!state || transitionsReducer[0].state === state) {
      return selector ? [selector(transitionsReducer[0]), transitionsReducer[1]] : transitionsReducer;
    }

    throw new Error(`You can not use "${state}" as the current state is "${transitionsReducer[0].state}"`);
  }) as any;
};

export const useExperimentalStatesReducer = <C extends TContext, E extends TEvent>(
  statesReducer: (context: C, event: E) => C,
  initialContext: C,
): StatesContext<C, E> => {
  const reducer = useReducer(statesReducer, initialContext);
  // This ensures a single value is created
  const [{ subscribe, subscribers }] = React.useState(() => {
    const subscribers: StatesListener<C, E>[] = [];

    return {
      subscribers,
      subscribe: (listener: StatesListener<C, E>) => {
        subscribers.push(listener);
        return () => {
          subscribers.splice(subscribers.indexOf(listener), 1);
        };
      },
    };
  });

  React.useEffect(() => {
    subscribers.forEach((listener) => {
      listener(reducer);
    });
  }, [reducer]);

  return Object.assign(reducer, {
    subscribe,
  });
};
