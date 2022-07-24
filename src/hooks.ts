import React from 'react';
import { $ACTION, $PREV_STATE, $TRANSITIONS } from './constants';
import { Manager } from './devtools/Manager';
import { IState } from './types';

export function useEnterState<S extends IState, SS extends S['state'] | S['state'][]>(
  state: S,
  states: SS,
  effect: (
    current: SS extends string[] ? S & { state: SS[number] } : SS extends string ? S & { state: SS } : never,
  ) => void | (() => void),
  deps: unknown[] = [],
) {
  const statesList: string[] = Array.isArray(states) ? states : [states];
  const currentState = state;
  const isMatch = statesList.includes(state.state);

  return React.useEffect(
    // @ts-ignore
    () => isMatch && effect(currentState),
    deps.concat(isMatch),
  );
}

export function useTransitionState<S extends IState, T extends S[typeof $TRANSITIONS] | S[typeof $TRANSITIONS][]>(
  state: S,
  transition: T,
  effect: T extends `${infer SP} => ${infer A} => ${infer SC}` | `${infer SP} => ${infer A} => ${infer SC}`[]
    ? (
        current: S & { state: SC },
        action: Exclude<S[typeof $ACTION], undefined> & { type: A },
        prev: S & { state: SP },
      ) => void | (() => void)
    : never,

  deps?: unknown[],
): void;
export function useTransitionState<S extends IState>(
  state: S,
  effect: (
    current: S,
    action: Exclude<S[typeof $ACTION], undefined> | undefined,
    prev: S | undefined,
  ) => void | (() => void),
  deps?: unknown[],
): void;
export function useTransitionState() {
  const state = arguments[0];
  const transitions = arguments[1];
  const cb = arguments[2] || arguments[1];
  const deps = Array.isArray(arguments[arguments.length - 1]) ? arguments[arguments.length - 1] : [];

  if (typeof transitions === 'function') {
    return React.useEffect(() => cb(state, state[$ACTION], state[$PREV_STATE]), deps.concat(state));
  }

  return React.useEffect(() => {
    const transitionsList: string[] = Array.isArray(transitions) ? transitions : [transitions];
    const currentState = state;
    const prevState = state[$PREV_STATE];
    const action = state[$ACTION];
    const transition = `${prevState?.state} => ${action?.type} => ${currentState.state}`;

    if (transitionsList.includes(transition)) {
      return cb(currentState, action, prevState);
    }
  }, deps.concat(state));
}

export const managerContext = React.createContext((null as unknown) as Manager);
