import React, { useContext, useEffect, useReducer } from 'react';

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

export type TMatch<C extends TContext, R = any> = {
  [State in C['state']]: (state: C extends { state: State } ? C : never) => R;
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
      [Type in E['type']]?: (
        event: E extends { type: Type } ? E : never,
        context: C extends { state: State } ? C : never,
      ) => C;
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

export function useUpdateEffect<C extends TContext, S extends C['state']>(
  context: C,
  state: S,
  effect: TEffect<C extends { state: S } ? C : never>,
) {
  useEffect(() => {
    if (context.state === state) {
      // @ts-ignore
      return effect(context);
    }
  }, [context]);
}

export function useEnterEffect<C extends TContext, S extends C['state']>(
  context: C,
  state: S,
  effect: TEffect<C extends { state: S } ? C : never>,
) {
  useEffect(() => {
    if (context.state === state) {
      // @ts-ignore
      return effect(context);
    }
  }, [context.state === state]);
}

export function useExitEffect<C extends TContext, S extends C['state']>(
  context: C,
  state: S,
  effect: TEffect<C extends { state: S } ? C : never>,
) {
  useEffect(() => {
    if (context.state === state) {
      return () => {
        // @ts-ignore
        effect(context);
      };
    }
  }, [context.state === state]);
}

export function useMatchEffect<C extends TContext, T extends TMatch<C, boolean>>(
  context: C,
  matches: T,
  effect: TEffect<
    C extends {
      state: {
        [U in keyof T]: T[U] extends () => infer R ? (R extends true ? U : never) : never;
      }[keyof T];
    }
      ? C
      : never
  >,
) {
  const shouldRun = match(context, matches as any);

  useEffect(() => {
    if (shouldRun) {
      // @ts-ignore
      return effect(context);
    }
  }, [shouldRun]);
}

export function match<C extends TContext, T extends TMatch<C>>(
  context: C,
): <R>(
  matches: TMatch<C, R>,
) => {
  [K in keyof T]: R;
}[keyof T];
export function match<C extends TContext, T extends TMatch<C>>(
  context: C,
  matches: T &
    {
      [K in keyof T]: K extends C['state'] ? T[K] : never;
    },
): {
  [K in keyof T]: T[K] extends () => infer R ? R : never;
}[keyof T];
export function match() {
  const context = arguments[0];
  const matches = arguments[1];

  if (matches) {
    // @ts-ignore This is an exhaustive check
    return matches[context.state](context);
  }

  // @ts-ignore Too complex for TS to do this correctly
  return (matches) => matches[context.state](context);
}
export interface StatesHook<C extends TContext, E extends TEvent> {
  (): States<C, E>;
  <S extends C['state']>(state: S): States<C extends { state: S } ? C : never, E>;
}

export function createReducer<C extends TContext, E extends TEvent>(
  transitions: {
    [State in C['state']]: {
      [Type in E['type']]?: (
        event: E extends { type: Type } ? E : never,
        context: C extends { state: State } ? C : never,
      ) => C;
    };
  },
) {
  // @ts-ignore
  return (context: C, event: E) => transition(context, event, transitions);
}

export function createContext<C extends TContext, E extends TEvent>() {
  return React.createContext({} as States<C, E>);
}

export function createHook<C extends TContext, E extends TEvent>(
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
export interface ExperimentalReducerHook<C extends TContext, E extends TEvent> {
  (): States<C, E>;
  <S extends C['state']>(state: S): States<C extends { state: S } ? C : never, E>;
  <S extends C['state'], O>(state: S, selector: (context: C extends { state: S } ? C : never) => O): [O, Send<E>];
}

interface ContextListener<C extends TContext, E extends TEvent> {
  (newTransitionsReducer: States<C, E>): void;
}
type StatesContext<C extends TContext, E extends TEvent> = States<C, E> & {
  subscribe: (listener: ContextListener<C, E>) => () => void;
};

export const createExperimentalContext = <C extends TContext, E extends TEvent>() =>
  React.createContext({} as StatesContext<C, E>);

export const createExperimentalHook = <C extends TContext, E extends TEvent>(
  transitionsReducerContext: React.Context<StatesContext<C, E>>,
): ExperimentalReducerHook<C, E> => {
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

export const useExperimentalReducer = <C extends TContext, E extends TEvent>(
  statesReducer: (context: C, event: E) => C,
  initialContext: C,
): StatesContext<C, E> => {
  const reducer = useReducer(statesReducer, initialContext);
  // This ensures a single value is created
  const [{ subscribe, subscribers }] = React.useState(() => {
    const subscribers: ContextListener<C, E>[] = [];

    return {
      subscribers,
      subscribe: (listener: ContextListener<C, E>) => {
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

export class Events<E extends TEvent> {
  private subscriptions: Array<(event: E) => void> = [];
  emit(event: E) {
    this.subscriptions.forEach((listener) => listener(event));
  }
  subscribe(listener: (event: E) => void) {
    this.subscriptions.push(listener);

    return () => {
      this.subscriptions.splice(this.subscriptions.indexOf(listener), 1);
    };
  }
}

export const events = <E extends TEvent>() => new Events<E>();

export const useEvents = <E extends TEvent>(events: Events<E>, send: Send<E>) => {
  useEffect(() =>
    events.subscribe((event) => {
      send(event);
    }),
  );
};
