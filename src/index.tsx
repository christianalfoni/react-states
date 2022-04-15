import React, { Dispatch, Reducer, useEffect, useReducer } from 'react';
import type { Manager } from './devtools/Manager';

export const DEBUG_ACTION = Symbol('DEBUG_ACTION');
export const DEBUG_TRANSITIONS = Symbol('DEBUG_TRANSITIONS');
export const DEBUG_COMMAND = Symbol('DEBUG_COMMAND');
export const COMMANDS = Symbol('COMMANDS');
export const DEBUG_ID = Symbol('DEBUG_ID');
export const ENVIRONMENT_CMD = '$ENVIRONMENT';
// Hack to make commands inferrable
export const MAKE_COMMANDS_INFERRABLE = Symbol('MAKE_COMMANDS_INFERRABLE');

export interface TState {
  state: string;
  [COMMANDS]?: {
    [cmd: string]: TCommand;
  };
}

export interface TAction {
  type: string;
}

export interface TCommand {
  cmd: string;
}

type CommandifyEnvironment<T extends TEnvironment> = {
  [A in keyof T]: A extends string
    ? {
        [B in keyof T[A]]: T[A][B] extends Function
          ? B extends string
            ? {
                call: `${A}.${B}`;
                params: Parameters<T[A][B]>;
              }
            : never
          : never;
      }[keyof T[A]]
    : never;
}[keyof T];

export type TMatch<S extends TState, R = any> = {
  [SS in S['state']]: (state: S extends { state: SS } ? S : never) => R;
};

export type PickState<
  ST extends StatesReducer<any, any, any>,
  T extends ST extends StatesReducer<infer S, any, any> ? S['state'] : never = never
> = ST extends StatesReducer<infer S, any, any>
  ? [T] extends [never]
    ? S
    : S extends { state: T }
    ? S
    : never
  : never;

export type PickAction<
  ST extends StatesReducer<any, any, any>,
  T extends ST extends StatesReducer<any, infer A, any> ? A['type'] : never
> = ST extends StatesReducer<any, infer A, any> ? (A extends { type: T } ? A : never) : never;

export type PickCommand<
  ST extends StatesReducer<any, any, any>,
  T extends ST extends StatesReducer<any, any, infer A> ? A['cmd'] : never
> = ST extends StatesReducer<any, any, infer C>
  ? C extends { cmd: T }
    ? {
        state: string;
        [COMMANDS]?: {
          [U in T]: C;
        };
      }
    : never
  : never;

export type StatesDispatcher<ST extends StatesReducer<any, any, any>> = ST extends StatesReducer<any, infer A, any>
  ? React.Dispatch<A>
  : never;

type StatesHandlers<ST extends StatesReducer<any, any, any>, SS extends TState> = ST extends StatesReducer<
  infer S,
  infer A,
  infer C
>
  ? {
      [AA in A['type']]?: (params: {
        state: SS;
        action: A extends { type: AA } ? A : never;
        transition: (...ret: [S, ...C[]]) => S | [S, ...C[]];
        noop: () => S & { state: SS };
      }) => StatesTransition<ST>;
    }
  : never;

type StatesHandlersWithEnvironment<
  ST extends StatesReducer<any, any, any>,
  PA extends TAction,
  EC extends TCommand,
  SS extends TState
> = ST extends StatesReducer<infer S, infer A, infer C>
  ? {
      [AA in A['type']]?: (params: {
        state: SS;
        action: A extends { type: AA } ? A : never;
        transition: (...params: [S, ...(C | EC)[]]) => S | [S, ...(C | EC)[]];
        noop: () => S & { state: SS };
      }) => S | [S, ...(C | EC)[]];
    } &
      {
        [PAA in PA['type']]?: (params: {
          state: SS;
          action: PA extends { type: PAA } ? PA : never;
          transition: (...params: [S, ...(C | EC)[]]) => S | [S, ...(C | EC)[]];
          noop: () => S & { state: SS };
        }) => S | [S, ...(C | EC)[]];
      }
  : never;

type StatesTransitions<ST extends StatesReducer<any, any, any>> = ST extends StatesReducer<infer S, any, any>
  ? {
      [SS in S['state']]: StatesHandlers<ST, S & { state: SS }>;
    }
  : never;

export function createReducerHandlers<
  ST extends StatesReducer<any, any, any>,
  SS extends ST extends StatesReducer<infer S, any, any> ? S['state'] : never = never
>(
  handlers: ST extends StatesReducer<infer S, any, any> ? StatesHandlers<ST, S & { state: SS }> : never,
): typeof handlers {
  return handlers;
}

type StatesTransitionsWithEnvironment<
  ST extends StatesReducer<any, any, any>,
  PA extends TAction,
  EC extends TCommand
> = ST extends StatesReducer<infer S, any, any>
  ? {
      [SS in S['state']]: StatesHandlersWithEnvironment<ST, PA, EC, S & { state: SS }>;
    }
  : never;

export type StatesReducer<
  S extends TState,
  A extends TAction = { type: never },
  C extends TCommand = { cmd: never }
> = [
  [C] extends [never]
    ? S
    : S &
        WithCommands<
          {
            [CC in C['cmd']]: C & { cmd: CC };
          }
        >,
  React.Dispatch<A>,
] & {
  [MAKE_COMMANDS_INFERRABLE]?: C;
};

export type StatesTransition<ST extends StatesReducer<any, any, any>> = ST extends StatesReducer<infer S, any, infer C>
  ? S | [S, ...C[]]
  : never;

// A workaround for https://github.com/microsoft/TypeScript/issues/37888
export type WithCommands<T> = {
  [COMMANDS]?: T;
};

export type StatesReducerFunction<ST extends StatesReducer<any, any, any>> = ST extends StatesReducer<
  infer S,
  infer A,
  infer C
>
  ? (
      state: S &
        WithCommands<
          {
            [CC in C['cmd']]: C & { cmd: CC };
          }
        >,
      action: A,
    ) => S &
      WithCommands<
        {
          [CC in C['cmd']]: C & { cmd: CC };
        }
      >
  : never;

export function createReducer<ST extends StatesReducer<any, any, any>>(
  transitions: StatesTransitions<ST>,
): StatesReducerFunction<ST> {
  return ((state: any, action: any) => transition(state, action, transitions)) as any;
}

// Type safe transition
function exactTransition(...params: any[]) {
  return params;
}

export function transition<S extends TState, A extends TAction, C extends TCommand = { cmd: never }>(
  state: S,
  action: A,
  transitions: StatesTransitions<StatesReducer<S, A, C>>,
) {
  let newState = state;
  let commands;

  // @ts-ignore
  const debugId = state[DEBUG_ID];

  // @ts-ignore
  if (transitions[state.state] && transitions[state.state][action.type]) {
    // @ts-ignore
    const result = transitions[state.state][action.type]({
      state,
      action,
      transition: exactTransition,
      noop: () => state,
    });

    commands = Array.isArray(result) ? result.slice(1) : undefined;
    newState = Array.isArray(result) ? result[0] : result;
    // @ts-ignore
    action[DEBUG_ACTION] && (newState !== state || commands) && action[DEBUG_ACTION](debugId, false);
  } else {
    // @ts-ignore
    action[DEBUG_ACTION] && action[DEBUG_ACTION](debugId, true);
  }

  if (debugId) {
    // @ts-ignore
    newState[DEBUG_ID] = debugId;

    // @ts-ignore
    newState[DEBUG_TRANSITIONS] = transitions;
  }

  // @ts-ignore
  newState[COMMANDS] = state[COMMANDS] || {};

  // @ts-ignore
  if (commands) {
    commands.forEach((command) => {
      // @ts-ignore
      newState[COMMANDS][command.cmd] = command;
    });

    // Ensure it updates
    if (newState === state) {
      newState = {
        ...newState,
      };
    }
  }

  return newState;
}

export function useCommandEffect<S extends TState, CC extends keyof Required<S>[typeof COMMANDS]>(
  state: S,
  cmd: CC,
  effect: (command: Required<S>[typeof COMMANDS][CC]) => void,
) {
  // @ts-ignore
  const command = state[COMMANDS] && state[COMMANDS][cmd];

  React.useEffect(() => {
    if (command) {
      // @ts-ignore
      effect(command);

      // @ts-ignore
      if (state[DEBUG_COMMAND]) {
        // @ts-ignore
        state[DEBUG_COMMAND](command);
      }
    }
    // We always transition transient states, as they are always entered
  }, [command]);
}

export function useStateEffect<S extends TState, SS extends S['state']>(
  state: S,
  current: SS | SS[],
  effect: (state: S extends { state: SS } ? S : never) => void | (() => void),
) {
  if (Array.isArray(current)) {
    // @ts-ignore
    const shouldRun = current.includes(state.state);

    React.useEffect(() => {
      if (shouldRun) {
        // @ts-ignore
        return effect(state);
      }
    }, [shouldRun]);
  } else {
    React.useEffect(() => {
      // @ts-ignore
      if (state.state === current) {
        // @ts-ignore
        return effect(state);
      }
      // We only run the effect when actually moving to a new state
      // @ts-ignore
    }, [state.state === current]);
  }
}

export function match<S extends TState, T extends TMatch<S>>(
  state: S,
  matches: T &
    {
      [K in keyof T]: S extends TState ? (K extends S['state'] ? T[K] : never) : never;
    },
): {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never;
}[keyof T];
export function match() {
  const state = arguments[0];
  const matches = arguments[1];

  if (matches) {
    // @ts-ignore This is an exhaustive check
    return matches[state.state](state);
  }

  // @ts-ignore Too complex for TS to do this correctly
  return (matches) => matches[state.state](state);
}

export class Emitter<S extends TAction> {
  private listeners: Array<(subscription: S) => void> = [];
  emit(subscription: S) {
    this.listeners.forEach((listener) => listener(subscription));
  }
  subscribe(listener: (subscription: S) => void) {
    this.listeners.push(listener);

    return () => {
      this.listeners.splice(this.listeners.indexOf(listener), 1);
    };
  }
}

export type Emit<S extends TAction> = (subscription: S) => void;

/**
 * @deprecated
 */
export const createSubscription = <S extends TAction>() => new Emitter<S>();

/**
 * @deprecated
 */
export const useSubscription = <S extends TAction>(subscription: Emitter<S>, dispatch: React.Dispatch<S>) => {
  React.useEffect(
    () =>
      subscription.subscribe((subscription) => {
        dispatch(subscription);
      }),
    [],
  );
};

export type TEnvironment = {
  [api: string]: {
    [key: string]: any;
  };
};

const environmentContext = React.createContext({});

/**
 * @deprecated
 */
export const createEnvironment = <E extends Record<string, any>>() => {
  const context = React.createContext<E>({} as E);
  const Provider = ({ children, environment }: { children: React.ReactNode; environment: Partial<E> }) => {
    return <context.Provider value={environment as E}>{children}</context.Provider>;
  };

  return {
    EnvironmentProvider: Provider,
    useEnvironment: () => React.useContext(context),
  };
};

export const defineEnvironment = <E extends TEnvironment, EA extends TAction = never>() => {
  const emitter = new Emitter<EA>();
  const boundEmit = emitter.emit.bind(emitter);
  const Provider = ({ children, environment }: { children: React.ReactNode; environment: E }) => {
    return (
      <environmentContext.Provider
        // @ts-ignore
        value={environment}
      >
        {children}
      </environmentContext.Provider>
    );
  };

  return {
    EnvironmentProvider: Provider,
    // @ts-ignore
    useEnvironment: (): E & { emitter: Emitter<S> } => React.useContext(environmentContext),
    createEnvironment: (environment: (emit: Emit<EA>) => E) => {
      return Object.assign(environment(boundEmit), {
        emitter,
      });
    },
    createReducer<ST extends StatesReducer<any, any, any>>(
      transitions: StatesTransitionsWithEnvironment<ST, EA, { cmd: typeof ENVIRONMENT_CMD } & CommandifyEnvironment<E>>,
    ): StatesReducerFunction<ST> {
      return ((state: any, action: any) => transition(state, action, transitions)) as any;
    },
    useReducer<T extends Reducer<any, any>>(
      name: string,
      reducer: T,
      initialState: T extends Reducer<infer ST, any> ? ST : never,
    ) {
      const states = useReducer(reducer, initialState);
      const environment = React.useContext(environmentContext);

      useDevtools(name, states);

      useEffect(() => {
        if (environment) {
          // @ts-ignore
          return environment.emitter.subscribe(states[1]);
        }
      }, []);

      useCommandEffect(states[0], '$ENVIRONMENT', ({ call, params }) => {
        const [partA, partB] = call.split('.');
        // @ts-ignore
        environment[partA][partB](params);
      });

      return states;
    },
    createReducerHandlers<
      ST extends StatesReducer<any, any, any>,
      T extends ST extends StatesReducer<infer S, any, any> ? S['state'] : never = never
    >(
      handlers: ST extends StatesReducer<infer S, any, any>
        ? StatesHandlersWithEnvironment<
            ST,
            EA,
            { cmd: typeof ENVIRONMENT_CMD } & CommandifyEnvironment<E>,
            S & { state: T }
          >
        : never,
    ): typeof handlers {
      return handlers;
    },
  };
};

const DEBUG_TRIGGER_TRANSITIONS = Symbol('DEBUG_TRIGGER_TRANSITIONS');

export const managerContext = React.createContext((null as unknown) as Manager);

// We have to type as any as States<any, any> throws error not matching
// the explicit context
export const useDevtools = (id: string, reducer: [any, any]) => {
  const manager = React.useContext(managerContext);

  // We allow using the hook without having the wrapping devtool
  if (!manager) {
    return reducer;
  }

  const [state, dispatch] = reducer;

  React.useEffect(() => () => manager.dispose(id), [id, manager]);

  // @ts-ignore
  reducer[0][DEBUG_ID] = id;
  // @ts-ignore
  reducer[0][DEBUG_COMMAND] = (command: { cmd: string }) => {
    manager.onMessage(id, {
      type: 'command',
      command,
    });
  };

  reducer[1] = (action: any) => {
    action[DEBUG_ACTION] = (id: string, isIgnored: boolean) => {
      manager.onMessage(id, {
        type: 'dispatch',
        action,
        ignored: isIgnored,
      });
    };

    dispatch(action);

    if (action.type === DEBUG_TRIGGER_TRANSITIONS) {
      manager.onMessage(id, {
        type: 'transitions',
        // @ts-ignore
        transitions: state[DEBUG_TRANSITIONS],
      });
      return;
    }
  };

  React.useEffect(() => {
    manager.onMessage(id, {
      type: 'state',
      state,
      // @ts-ignore
      transitions: state[DEBUG_TRANSITIONS],
      triggerTransitions: () => {
        // We dispatch to ensure the transition is run
        reducer[1]({
          type: DEBUG_TRIGGER_TRANSITIONS,
        });
      },
    });
  }, [id, manager, state]);

  return reducer;
};
