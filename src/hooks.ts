import React from 'react';
import { $ACTION, $TRANSITIONS, $PREV_STATE } from './constants';
import { Manager } from './devtools/Manager';
import { IState } from './types';
import { stateChangeTracker, upsertStateChange } from './utils';

export function useStateTransition<
  S extends IState,
  SS extends
    | S['state']
    | S['state'][]
    | {
        [SS in keyof Exclude<S[typeof $TRANSITIONS], undefined>]?: keyof Exclude<S[typeof $TRANSITIONS], undefined>[SS];
      }
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
    : SS extends { [state: string]: string }
    ? (
        action: Exclude<S[typeof $ACTION], undefined> & {
          type: {
            [AA in keyof SS]: SS[AA] extends Exclude<S[typeof $ACTION], undefined>['type'] ? SS[AA] : never;
          }[keyof SS];
        },
        prev: S extends {
          state: keyof SS;
        }
          ? S
          : never,
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
    const stateChange = stateChangeTracker.get(state);
    return React.useEffect(() => {
      const disposer = cb(state, stateChange?.action, stateChange?.prevState);

      return () => {
        disposer?.();
        stateChangeTracker.delete(state);
      };
    }, deps.concat(state));
  }

  if (typeof transitions === 'string' || Array.isArray(transitions)) {
    const statesList: string[] = Array.isArray(transitions) ? transitions : [transitions];
    const currentState = state;
    const isMatch = statesList.includes(state.state);

    return React.useEffect(
      // @ts-ignore
      () => {
        let disposer = isMatch ? cb(currentState) : undefined;

        return () => {
          disposer?.();
          stateChangeTracker.delete(state);
        };
      },
      deps.concat(isMatch),
    );
  }

  return React.useEffect(() => {
    const stateChange = stateChangeTracker.get(state);
    const currentState = state;
    const prevState = stateChange?.prevState;
    const action = stateChange?.action;
    const stateTransition = prevState?.state && action?.type && transitions[prevState?.state]?.[action?.type];
    const actionTransition =
      prevState?.state && action?.type && typeof transitions[prevState?.state] === 'string'
        ? transitions[prevState?.state]
        : undefined;

    if (stateTransition) {
      const targetStates = Array.isArray(stateTransition) ? stateTransition : [stateTransition];
      if (targetStates.includes(currentState.state)) {
        const disposer = cb(currentState, action, prevState);
        return () => {
          disposer?.();
          stateChangeTracker.delete(state);
        };
      }
    } else if (actionTransition && actionTransition === action?.type) {
      const disposer = cb(action, prevState);
      return () => {
        disposer?.();
        stateChangeTracker.delete(state);
      };
    }

    return () => {
      stateChangeTracker.delete(state);
    };
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

  const [state] = reducer;

  React.useEffect(() => () => manager.dispose(id), [id, manager]);

  upsertStateChange(reducer[0], {
    debugDispatch: (action, isIgnored) => {
      manager.onMessage(id, {
        type: 'dispatch',
        action,
        ignored: isIgnored,
      });
    },
  });

  React.useEffect(() => {
    manager.onMessage(id, {
      type: 'state',
      state,
    });
  }, [id, manager, state]);

  return reducer;
};
