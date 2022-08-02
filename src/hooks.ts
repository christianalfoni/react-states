import React from 'react';
import {
  $ACTION,
  DEBUG_TRIGGER_TRANSITIONS,
  DEBUG_ID,
  DEBUG_COMMAND,
  DEBUG_TRANSITIONS,
  $TRANSITIONS,
  $PREV_STATE,
} from './constants';
import { Manager } from './devtools/Manager';
import { IState } from './types';

export function useStateTransition<
  S extends IState,
  SS extends
    | S['state']
    | S['state'][]
    | {
        [SS in keyof Exclude<S[typeof $TRANSITIONS], undefined>]?: {
          [AA in keyof Exclude<S[typeof $TRANSITIONS], undefined>[SS]]?:
            | Exclude<S[typeof $TRANSITIONS], undefined>[SS][AA]
            | Exclude<S[typeof $TRANSITIONS], undefined>[SS][AA][];
        };
      }
>(
  state: S,
  states: SS,
  effect: SS extends S['state'] | S['state'][]
    ? (
        current: SS extends string[] ? S & { state: SS[number] } : SS extends string ? S & { state: SS } : never,
      ) => void | (() => void)
    : (
        current: S extends {
          state: {
            [SSS in keyof SS]: {
              [AAA in keyof SS[SSS]]: SS[SSS][AAA];
            }[keyof SS[SSS]];
          }[keyof SS];
        }
          ? S
          : never,
        action: Exclude<S[typeof $ACTION], undefined> & {
          type: {
            [SSS in keyof SS]: {
              [AAA in keyof SS[SSS]]: AAA;
            }[keyof SS[SSS]];
          }[keyof SS];
        },
        prev: S extends {
          state: keyof SS;
        }
          ? S
          : never,
      ) => void | (() => void),
  deps?: unknown[],
): void;
export function useStateTransition<S extends IState>(
  state: S,
  effect: (
    current: S,
    action: Exclude<S[typeof $ACTION], undefined> | undefined,
    prev: S | undefined,
  ) => void | (() => void),
  deps?: unknown[],
): void;
export function useStateTransition() {
  const state = arguments[0];
  const transitions = arguments[1];
  const cb = arguments[2] || arguments[1];
  const deps = Array.isArray(arguments[arguments.length - 1]) ? arguments[arguments.length - 1] : [];

  if (typeof transitions === 'function') {
    return React.useEffect(() => cb(state, state[$ACTION], state[$PREV_STATE]), deps.concat(state));
  }

  if (typeof transitions === 'string' || Array.isArray(transitions)) {
    const statesList: string[] = Array.isArray(transitions) ? transitions : [transitions];
    const currentState = state;
    const isMatch = statesList.includes(state.state);

    return React.useEffect(
      // @ts-ignore
      () => isMatch && cb(currentState),
      deps.concat(isMatch),
    );
  }

  return React.useEffect(() => {
    const currentState = state;
    const prevState = state[$PREV_STATE];
    const action = state[$ACTION];
    const transition = transitions[prevState?.state]?.[action?.type];

    if (transition) {
      const targetStates = Array.isArray(transition) ? transition : [transition];
      if (targetStates.includes(currentState.state)) {
        return cb(currentState, action, prevState);
      }
    }
  }, deps.concat(state));
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
