import React, { Dispatch } from 'react';
import type { Manager } from './devtools/Manager';

export const $ACTION = Symbol('ACTION');
export const $PREV_STATE = Symbol('PREV_STATE');
export const DEBUG_TRANSITIONS = Symbol('DEBUG_TRANSITIONS');
export const DEBUG_COMMAND = Symbol('DEBUG_COMMAND');
export const DEBUG_ID = Symbol('DEBUG_ID');

const DEBUG_TRIGGER_TRANSITIONS = Symbol('DEBUG_TRIGGER_TRANSITIONS');

export interface IState {
  state: string;
  [$ACTION]?: IAction;
  [$PREV_STATE]?: IState;
}

export interface IAction {
  type: string;
}

type TMatch<S extends IState, R = any> = {
  [SS in S['state']]: (state: S & { state: SS }) => R;
};

type TPartialMatch<S extends IState, R = any> = {
  [SS in S['state']]?: (state: S & { state: SS }) => R;
};

export type PickState<S extends IState, T extends S['state'] = never> = [T] extends [never]
  ? S
  : S extends { state: T }
  ? S
  : never;

export type PickAction<A extends IAction, T extends A['type']> = A extends { type: T } ? A : never;

export type TTransition<S extends IState, A extends IAction, SS extends S['state'] = S['state']> = {
  [AA in A['type']]?: (state: S & { state: SS }, action: A extends { type: AA } ? A : never) => S;
};

export type TTransitions<S extends IState, A extends IAction> = {
  [SS in S['state']]: TTransition<S, A, SS>;
};

export function transition<S extends IState, A extends IAction>(
  state: S,
  action: A,
  transitions: TTransitions<S, A>,
): S & { [$ACTION]?: A; [$PREV_STATE]?: S } {
  let newState = state;

  // @ts-ignore
  const debugId = state[DEBUG_ID];

  // @ts-ignore
  if (transitions[state.state] && transitions[state.state][action.type]) {
    // @ts-ignore
    newState = transitions[state.state][action.type](state, action);
    newState[$ACTION] = action;
    // @ts-ignore
    action[$ACTION] && newState !== state && action[$ACTION](debugId, false);
    newState[$PREV_STATE] = state;
  } else {
    // @ts-ignore
    action[$ACTION] && action[$ACTION](debugId, true);
  }

  if (debugId) {
    // @ts-ignore
    newState[DEBUG_ID] = debugId;

    // @ts-ignore
    newState[DEBUG_TRANSITIONS] = transitions;
  }

  return newState as any;
}

export function useTransitionEffect<
  S extends IState,
  SS extends S['state'] | S['state'][],
  AA extends Exclude<S[typeof $ACTION], undefined>['type'] | Exclude<S[typeof $ACTION], undefined>['type'][],
  SF extends S['state'] | S['state'][]
>(
  state: S,
  transition: SS,
  effect: (transition: {
    to: SS extends S['state'][] ? (S extends { state: SS[number] } ? S : never) : S extends { state: SS } ? S : never;
    action?: AA extends Exclude<S[typeof $ACTION], undefined>['type'][]
      ? Exclude<S[typeof $ACTION], undefined> & { type: AA[number] }
      : Exclude<S[typeof $ACTION], undefined> & { type: AA };
    from?: SF extends S['state'][]
      ? S extends { state: SF[number] }
        ? S
        : never
      : S extends { state: SF }
      ? S
      : never;
  }) => void,
  deps?: unknown[],
): void;
export function useTransitionEffect<
  S extends IState,
  SS extends S['state'] | S['state'][],
  AA extends Exclude<S[typeof $ACTION], undefined>['type'] | Exclude<S[typeof $ACTION], undefined>['type'][],
  SF extends S['state'] | S['state'][]
>(
  state: S,
  transition: {
    to: SS;
    action?: AA;
    from?: SF;
  },
  effect: (transition: {
    to: SS extends S['state'][] ? (S extends { state: SS[number] } ? S : never) : S extends { state: SS } ? S : never;
    action: AA extends Exclude<S[typeof $ACTION], undefined>['type'][]
      ? Exclude<S[typeof $ACTION], undefined> & { type: AA[number] }
      : Exclude<S[typeof $ACTION], undefined> & { type: AA };
    from: SF extends S['state'][] ? (S extends { state: SF[number] } ? S : never) : S extends { state: SF } ? S : never;
  }) => void,
  deps?: unknown[],
): void;
export function useTransitionEffect<
  S extends IState,
  SS extends S['state'] | S['state'][],
  AA extends Exclude<S[typeof $ACTION], undefined>['type'] | Exclude<S[typeof $ACTION], undefined>['type'][],
  SF extends S['state'] | S['state'][]
>(
  state: S,
  transition: {
    to?: SS;
    action: AA;
    from?: SF;
  },
  effect: (transition: {
    to: SS extends S['state'][] ? (S extends { state: SS[number] } ? S : never) : S extends { state: SS } ? S : never;
    action: AA extends Exclude<S[typeof $ACTION], undefined>['type'][]
      ? Exclude<S[typeof $ACTION], undefined> & { type: AA[number] }
      : Exclude<S[typeof $ACTION], undefined> & { type: AA };
    from: SF extends S['state'][] ? (S extends { state: SF[number] } ? S : never) : S extends { state: SF } ? S : never;
  }) => void,
  deps?: unknown[],
): void;
export function useTransitionEffect<
  S extends IState,
  SS extends S['state'] | S['state'][],
  AA extends Exclude<S[typeof $ACTION], undefined>['type'] | Exclude<S[typeof $ACTION], undefined>['type'][],
  SF extends S['state'] | S['state'][]
>(
  state: S,
  transition: {
    to?: SS;
    action?: AA;
    from: SF;
  },
  effect: (transition: {
    to: SS extends S['state'][] ? (S extends { state: SS[number] } ? S : never) : S extends { state: SS } ? S : never;
    action: AA extends Exclude<S[typeof $ACTION], undefined>['type'][]
      ? Exclude<S[typeof $ACTION], undefined> & { type: AA[number] }
      : Exclude<S[typeof $ACTION], undefined> & { type: AA };
    from: SF extends S['state'][] ? (S extends { state: SF[number] } ? S : never) : S extends { state: SF } ? S : never;
  }) => void,
  deps?: unknown[],
): void;
export function useTransitionEffect<S extends IState>(
  state: S,
  effect: (transition: { to: S; action?: Exclude<S[typeof $ACTION], undefined>; from?: S }) => void,
  deps?: unknown[],
): void;
export function useTransitionEffect() {
  const state = arguments[0];
  const prevState = state[$PREV_STATE];
  const action = state[$ACTION];
  const effectPayload = { to: state, action: action, from: prevState };

  if (typeof arguments[1] === 'string') {
    const current = arguments[1];
    const effect = arguments[2];
    const deps = arguments[3] || [];

    return React.useEffect(() => {
      // @ts-ignore
      if (state.state === current) {
        // @ts-ignore
        return effect(effectPayload);
      }
      // We only run the effect when actually moving to a new state
      // @ts-ignore
    }, deps.concat(state.state === current));
  }

  if (Array.isArray(arguments[1])) {
    const current = arguments[1];
    const effect = arguments[2];
    const deps = arguments[3] || [];
    // @ts-ignore
    const shouldRun = current.includes(state.state);

    return React.useEffect(() => {
      if (shouldRun) {
        // @ts-ignore
        return effect(effectPayload);
      }
    }, deps.concat(shouldRun));
  }

  if (typeof arguments[1] === 'function') {
    const deps = arguments[2] || [];
    const effect = arguments[1];

    return React.useEffect(() => {
      prevState && effect(effectPayload);
    }, deps.concat(state));
  }

  const transition = arguments[1];
  const effect = arguments[2];
  const deps = arguments[3] || [];

  React.useEffect(() => {
    if (transition.to) {
      if (typeof transition.to === 'string' && state.state !== transition.to) {
        return;
      }

      if (Array.isArray(transition.to) && !transition.to.includes(prevState?.state)) {
        return;
      }

      if (transition.from) {
        if (typeof transition.from === 'string' && prevState?.state !== transition.from) {
          return;
        }

        if (Array.isArray(transition.from) && !transition.from.includes(prevState?.state)) {
          return;
        }
      }

      if (transition.action) {
        if (typeof transition.action === 'string' && action?.type === transition.action) {
          prevState && effect(effectPayload);
        } else if (Array.isArray(transition.action) && transition.action.includes(action?.type)) {
          prevState && effect(effectPayload);
        }
        return;
      }

      prevState && effect(effectPayload);

      return;
    }

    if (transition.from) {
      if (typeof transition.from === 'string' && prevState?.state !== transition.from) {
        return;
      }

      if (Array.isArray(transition.from) && !transition.from.includes(prevState?.state)) {
        return;
      }

      if (transition.action) {
        if (typeof transition.action === 'string' && action?.type === transition.action) {
          prevState && effect(effectPayload);
        } else if (Array.isArray(transition.action) && transition.action.includes(action?.type)) {
          prevState && effect(effectPayload);
        }
        return;
      }

      prevState && effect(effectPayload);

      return;
    }

    if (transition.action) {
      if (typeof transition.action === 'string' && action?.type === transition.action) {
        prevState && effect(effectPayload);
      } else if (Array.isArray(transition.action) && transition.action.includes(action?.type)) {
        prevState && effect(effectPayload);
      }
    }
  }, deps.concat(state));
}

export function match<S extends IState, T extends TMatch<S>>(
  state: S,
  matches: T,
): {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never;
}[keyof T];
export function match<S extends IState, T extends TPartialMatch<S>, U>(
  state: S,
  matches: T,
  _: (state: S & { state: Exclude<S['state'], keyof T> }) => U,
):
  | {
      [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never;
    }[keyof T]
  | U;
export function match() {
  const state = arguments[0];
  const matches = arguments[1];
  const _ = arguments[2];

  if (_) {
    return (matches[state.state] || _)(state);
  }

  return matches[state.state](state);
}

export function matchProp<
  S extends IState,
  P extends {
    [K in keyof S]: keyof (S & { state: K });
  }[keyof S]
>(state: S, prop: P): S extends Record<P, unknown> ? S : undefined;
export function matchProp() {
  const state = arguments[0];
  const prop = arguments[1];
  // @ts-ignore
  return prop in state ? state : undefined;
}

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
    action[$ACTION] = (id: string, isIgnored: boolean) => {
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

export type TEmit<T extends IAction> = (event: T) => void;

export type TSubscribe<T extends IAction> = (listener: (event: T) => void) => void;

export const createEmitter = <T extends IAction>(): {
  emit: TEmit<T>;
  subscribe: TSubscribe<T>;
} => {
  const listeners: TEmit<T>[] = [];

  return {
    emit(event) {
      listeners.forEach((listener) => listener(event));
    },
    subscribe(listener) {
      listeners.push(listener);

      return () => {
        listeners.splice(listeners.indexOf(listener), 1);
      };
    },
  };
};
