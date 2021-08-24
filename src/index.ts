import React, { Dispatch, useReducer } from 'react';

export const DEBUG_IS_EVENT_IGNORED = Symbol('DEBUG_IS_EVENT_IGNORED');
export const DEBUG_TRANSITIONS = Symbol('DEBUG_TRANSITIONS');
export const DEBUG_COMMAND = Symbol('DEBUG_COMMAND');
export const COMMANDS = Symbol('COMMANDS');

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

export interface TSubscription {
  type: string;
}

export type TMatch<S extends TState, R = any> = {
  [SS in S['state']]: (state: S extends { state: SS } ? S : never) => R;
};

export type PickState<S extends TState, SS extends S['state']> = S extends {
  state: SS;
}
  ? S
  : never;

export type Transitions<S extends TState, A extends TAction, C extends TCommand = never> = {
  [SS in S['state']]: {
    [AA in A['type']]?: (
      state: S extends { state: SS } ? S : never,
      action: A extends { type: AA } ? A : never,
    ) => [C] extends [never] ? S : S | [S, C];
  };
};

export type PickAction<A extends TAction, T extends A['type']> = A extends { type: T } ? A : never;

export type StateTransition<S extends TState, C extends TCommand = never> = [C] extends [never] ? S : S | [S, C];

export function createContext<S extends TState, A extends TAction>() {
  return React.createContext<[S, React.Dispatch<A>]>([] as any);
}

export function useStates<T extends Transitions<any, any, any>>(
  transitions: T,
  initialState: T extends Transitions<infer S, any, any> ? S : never,
): [
  T extends Transitions<infer S, any, infer C>
    ? S & {
        [COMMANDS]?: {
          [CC in C['cmd']]: C & { cmd: CC };
        };
      }
    : never,
  Dispatch<T extends Transitions<any, infer A, any> ? A : never>,
] {
  return useReducer((state: any, action: any) => transition(state, action, transitions), initialState) as any;
}

export function transition<S extends TState, A extends TAction, C extends TCommand = never>(
  state: S,
  action: A,
  transitions: Transitions<S, A, C>,
) {
  let newState = state;
  let command;

  // @ts-ignore
  if (transitions[state.state] && transitions[state.state][action.type]) {
    // @ts-ignore
    const result = transitions[state.state][action.type](state, action);

    command = Array.isArray(result) ? result[1] : undefined;
    newState = Array.isArray(result) ? result[0] : result;
  } else {
    // @ts-ignore
    action[DEBUG_IS_EVENT_IGNORED] = true;
  }

  // @ts-ignore
  newState[DEBUG_TRANSITIONS] = transitions;

  // @ts-ignore
  newState[COMMANDS] = state[COMMANDS] || {};

  // @ts-ignore
  if (command) {
    // @ts-ignore
    newState[COMMANDS][command.cmd] = command;

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

export class Subscription<S extends TSubscription> {
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

export const subscription = <S extends TSubscription>() => new Subscription<S>();

export const useSubsription = <S extends TSubscription>(subscription: Subscription<S>, dispatch: React.Dispatch<S>) => {
  React.useEffect(
    () =>
      subscription.subscribe((subscription) => {
        dispatch(subscription);
      }),
    [],
  );
};
