import { $ACTION, $PREV_STATE, $TRANSITIONS } from './constants';
import { IAction, IState, StateChange, TMatch, TPartialMatch, TTransitions } from './types';

export const stateChangeTracker = new WeakMap<IState, StateChange>();

export function upsertStateChange(state: IState, change: StateChange) {
  const stateChange = stateChangeTracker.get(state);
  const updatedStateChange = {
    ...stateChange,
    ...change,
  };

  stateChangeTracker.set(state, updatedStateChange);

  return updatedStateChange;
}

export function transition<S extends IState, A extends IAction, T extends TTransitions<S, A>>(
  state: S,
  action: A,
  transitions: T,
): S & {
  // Only for typing inference
  [$ACTION]?: A;
  [$PREV_STATE]?: S;
  [$TRANSITIONS]?: {
    [SS in keyof T]: {
      [AA in keyof T[SS]]: T[SS][AA] extends (...args: any) => IState ? ReturnType<T[SS][AA]>['state'] : never;
    };
  };
} {
  let newState = state;

  const stateChange = stateChangeTracker.get(state);

  // @ts-ignore
  if (transitions[state.state] && transitions[state.state][action.type]) {
    // @ts-ignore
    newState = transitions[state.state][action.type](state, action);

    stateChange?.debugDispatch?.(action, false);

    upsertStateChange(newState, {
      action,
      prevState: state,
    });

    stateChangeTracker.delete(state);
  } else {
    stateChange?.debugDispatch?.(action, true);
  }

  return newState as any;
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
  }[keyof S],
>(state: S, prop: P): S extends Record<P, unknown> ? S : undefined;
export function matchProp() {
  const state = arguments[0];
  const prop = arguments[1];
  // @ts-ignore
  return prop in state ? state : undefined;
}
