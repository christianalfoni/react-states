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

export type TransitionsReducer<C extends TContext, E extends TEvent> = [C, React.Dispatch<E>];

export type PickState<C extends { state: string }, SS extends C['state']> = C extends { state: SS } ? C : never;

export type PickEvent<E extends TEvent, T extends E['type']> = E extends { type: T } ? E : never;

export type Send<E extends TEvent> = (event: E) => void;

export function transitions<C extends TContext, E extends TEvent>(
  transitions: {
    [State in C['state']]: {
      [Type in E['type']]?: (event: E & { type: Type }, context: C & { state: State }) => C;
    };
  },
): (context: C, event: E) => C {
  return (context, event) => {
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
  };
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
  // @ts-ignore
  return matches[context.state] ? matches[context.state](context) : null;
}

export function createTransitionsReducerHook<T extends TransitionsReducer<any, any>>(
  reducerContext: React.Context<T>,
): T extends TransitionsReducer<infer C, infer E>
  ? <S extends T[0]['state']>(state?: S) => TransitionsReducer<C & { state: S }, E>
  : never {
  return ((state: string) => {
    const feature = useContext<T>(reducerContext);

    if (!state || feature[0].state === state) {
      return feature;
    }

    throw new Error(`You can not use "${state}" as the current state is "${feature[0].state}"`);
  }) as any;
}

export const createTransitionsReducerContext = <C extends TContext, E extends TEvent>(): React.Context<
  TransitionsReducer<C, E>
> => React.createContext({} as TransitionsReducer<C, E>);

/*
  EXPERIMENTAL
*/
export interface TransitionsReducerHook<C extends TContext, E extends TEvent> {
  (): TransitionsReducer<C, E>;
  <S extends C['state']>(state: S): TransitionsReducer<C & { state: S }, E>;
  <S extends C['state'], O>(state: S, selector: (context: C & { state: S }) => O): [O, Send<E>];
}

interface TransitionsReducerListener<C extends TContext, E extends TEvent> {
  (newTransitionsReducer: TransitionsReducer<C, E>): void;
}
type TransitionsReducerContext<C extends TContext, E extends TEvent> = TransitionsReducer<C, E> & {
  subscribe: (listener: TransitionsReducerListener<C, E>) => () => void;
};

export const createExperimentalTransitionsReducerContext = <C extends TContext, E extends TEvent>() =>
  React.createContext({} as TransitionsReducerContext<C, E>);

export const createExperimentalTransitionsReducerHook = <C extends TContext, E extends TEvent>(
  transitionsReducerContext: React.Context<TransitionsReducerContext<C, E>>,
): TransitionsReducerHook<C, E> => {
  return ((state?: string, selector?: (context: C) => any) => {
    const context = useContext<TransitionsReducerContext<C, E>>(transitionsReducerContext);
    const [transitionsReducer, setTransitionsReducer] = React.useState<TransitionsReducer<C, E>>(context);

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

export const useExperimentalTransitionsReducer = <C extends TContext, E extends TEvent>(
  transitionsReducer: (context: C, event: E) => C,
  initialContext: C,
): TransitionsReducerContext<C, E> => {
  const reducer = useReducer(transitionsReducer, initialContext);
  // This ensures a single value is created
  const [{ subscribe, subscribers }] = React.useState(() => {
    const subscribers: TransitionsReducerListener<C, E>[] = [];

    return {
      subscribers,
      subscribe: (listener: TransitionsReducerListener<C, E>) => {
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
