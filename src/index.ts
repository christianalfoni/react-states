import React, { useContext, useEffect, useReducer } from 'react';

export const DEBUG_IS_EVENT_IGNORED = Symbol('DEBUG_IS_EVENT_IGNORED');
export const DEBUG_TRANSITIONS = Symbol('DEBUG_TRANSITIONS');
export const TRANSIENT_CONTEXT = Symbol('TRANSIENT_CONTEXT');

export interface TContext {
  state: string;
}

export interface TEvent {
  type: string;
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
    [State in C['state']]:
      | {
          [Type in E['type']]?: (
            event: E extends { type: Type } ? E : never,
            context: C extends { state: State } ? C : never,
          ) => C;
        }
      | ((context: C extends { state: State } ? C : never) => C);
  },
) {
  let newContext = context;

  // @ts-ignore
  if (transitions[context.state] && transitions[context.state][event.type]) {
    // @ts-ignore
    newContext = transitions[context.state][event.type](event, context);

    // @ts-ignore
    if (typeof transitions[newContext.state] === 'function') {
      const transientContext = newContext;
      // @ts-ignore
      newContext = transitions[newContext.state](newContext);
      // @ts-ignore
      newContext[TRANSIENT_CONTEXT] = transientContext;
    } else {
      // @ts-ignore
      delete newContext[TRANSIENT_CONTEXT];
    }
  } else {
    // @ts-ignore
    event[DEBUG_IS_EVENT_IGNORED] = true;
  }

  // @ts-ignore
  newContext[DEBUG_TRANSITIONS] = transitions;

  return newContext;
}

export function useEnterEffect<C extends TContext, S extends C['state']>(
  context: C,
  state: S,
  effect: TEffect<C extends { state: S } ? C : never>,
) {
  // @ts-ignore
  const isTransient = context[TRANSIENT_CONTEXT];

  // @ts-ignore
  const evaluatedContext = context[TRANSIENT_CONTEXT] || context;

  // @ts-ignore
  if (isTransient) {
    useEffect(() => {
      if (evaluatedContext.state === state) {
        // @ts-ignore
        return effect(evaluatedContext);
      }
      // We always transition transient states, as they are always entered
    }, [evaluatedContext]);
  } else {
    useEffect(() => {
      if (evaluatedContext.state === state) {
        // @ts-ignore
        return effect(evaluatedContext);
      }
      // We only run the effect when actually moving to a new state
    }, [evaluatedContext.state === state]);
  }
}

export function useMatchEffect<C extends TContext, S extends C['state']>(
  context: C,
  matches: S[],
  effect: TEffect<
    C extends {
      state: S;
    }
      ? C
      : never
  >,
) {
  // @ts-ignore
  const shouldRun = matches.includes(context.state);

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
  <S extends C['state']>(...states: S[]): States<C extends { state: S } ? C : never, E>;
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
): (context: C, event: E) => C;
export function createReducer<C extends TContext, E extends TEvent, TC extends TContext>(
  transitions: {
    [State in C['state']]: {
      [Type in E['type']]?: (
        event: E extends { type: Type } ? E : never,
        context: C extends { state: State } ? C : never,
      ) => C | TC;
    };
  },
  transientTransitions: {
    [State in TC['state']]: (context: TC extends { state: State } ? TC : never) => C;
  },
): (context: C | TC, event: E) => C | TC;
export function createReducer<C extends TContext, E extends TEvent, TC extends TContext>(
  transitions: {
    [State in C['state']]: {
      [Type in E['type']]?: (
        event: E extends { type: Type } ? E : never,
        context: C extends { state: State } ? C : never,
      ) => C;
    };
  },
  transientTransitions?: {
    [State in TC['state']]: (context: TC extends { state: State } ? C : never) => C;
  },
) {
  // @ts-ignore
  return (context: C, event: E) =>
    transition(context, event, {
      ...transitions,
      ...transientTransitions,
    });
}

export function createContext<C extends TContext, E extends TEvent>(): {
  Provider: React.Provider<States<C, E>>;
  Consumer: React.Consumer<States<C, E>>;
  displayName?: string;
};
export function createContext<C extends TContext, E extends TEvent, TC extends TContext>(): {
  Provider: React.Provider<States<C | TC, E>>;
  Consumer: React.Consumer<States<C, E>>;
  displayName?: string;
};
export function createContext<C extends TContext, E extends TEvent>(): {
  Provider: React.Provider<States<C, E>>;
  Consumer: React.Consumer<States<C, E>>;
  displayName?: string;
} {
  // @ts-ignore
  return React.createContext({});
}

export function createHook<PC extends TContext, E extends TEvent, CC extends TContext>(statesContext: {
  Provider: React.Provider<States<PC, E>>;
  Consumer: React.Consumer<States<CC, E>>;
  displayName?: string;
}): StatesHook<CC, E> {
  return ((...states: string[]) => {
    // @ts-ignore
    const context = useContext(statesContext);

    if (!states.length || states.includes(context[0].state as string)) {
      return context;
    }

    throw new Error(`You can not use "${states.join('", "')}" as the current state is "${String(context[0].state)}"`);
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

    throw new Error(`You can not use "${state}" as the current state is "${String(transitionsReducer[0].state)}"`);
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
  useEffect(
    () =>
      events.subscribe((event) => {
        send(event);
      }),
    [],
  );
};
