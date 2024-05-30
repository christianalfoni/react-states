import { useEffect, useMemo, useReducer } from "react";

export const debugging = {
  active: false,
};

type TState = {
  status: string;
};

type TEffect = {
  type: string;
};

type TAction = {
  type: string;
};

type TStateEffect = [TState, TEffect | null];

type TTransitions<S extends TStateEffect, A extends TAction> = {
  [SS in S[0]["status"]]: {
    [AA in A["type"]]?: (
      action: A & { type: AA },
      state: S[0] & { status: SS }
    ) => S[0] | S;
  };
};

type TTransitionsHook<
  S extends TState,
  A extends TAction,
  E extends TEffect
> = (
  effects: {
    [EE in E["type"]]: (effect: E & { type: EE }) => void;
  },
  initialState: S
) => [S, (action: A) => void];

function transition<const S extends TStateEffect, const A extends TAction>(
  stateEffect: S,
  action: A,
  transitions: TTransitions<S, A>
): S {
  const [state] = stateEffect;
  const result =
    transitions[state.status as S[0]["status"]]?.[action.type as A["type"]]?.(
      action,
      state
    ) ?? stateEffect;

  return Array.isArray(result) ? result : ([result, null] as S);
}

function exec<
  E extends TEffect,
  T extends {
    [EE in E["type"]]: (effect: E & { type: EE }) => void;
  }
>(effect: E | null, commands: T) {
  if (!effect || !commands[effect.type as E["type"]]) {
    return;
  }

  return commands[effect.type as E["type"]](effect);
}

type TMatch<S extends TState, R = any> = {
  [SS in S["status"]]: (state: S & { status: SS }) => R;
};

type TPartialMatch<S extends TState, R = any> = {
  [SS in S["status"]]?: (state: S & { status: SS }) => R;
};

export function match<S extends TState, T extends TMatch<S>>(
  state: S,
  matches: T
): {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never;
}[keyof T];
export function match<S extends TState, T extends TPartialMatch<S>, U>(
  state: S,
  matches: T,
  _: (state: S & { status: Exclude<S["status"], keyof T> }) => U
):
  | {
      [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never;
    }[keyof T]
  | U;
export function match<
  S extends TState,
  P extends {
    [K in keyof S]: keyof (S & { status: K });
  }[keyof S]
>(state: S, prop: P): S extends Record<P, unknown> ? S : undefined;
export function match() {
  const state = arguments[0];
  const matches = arguments[1];
  const _ = arguments[2];

  if (typeof matches === "string") {
    return matches in state ? state : undefined;
  }

  if (_) {
    return (matches[state.status] || _)(state);
  }

  return matches[state.status](state);
}

export function createTransitionsHook<
  S extends TState,
  A extends TAction,
  E extends TEffect
>(
  transitions: (
    transition: (state: S, effect?: E) => [S, E | null]
  ) => TTransitions<[S, E | null], A>
): TTransitionsHook<S, A, E> {
  // Tracks dispatches so that the debugger does not give
  // duplicate logs during strict mode
  let hasPendingAction = false;

  const result = (state: S, effect?: E) => {
    return [state, effect || null] as [S, E | null];
  };

  return (effects, initialState) => {
    const [[state, effect], dispatch] = useReducer(
      (stateEffect: [S, E | null], action: A) => {
        const newStateEffect = transition<[S, E | null], A>(
          stateEffect,
          action,
          transitions(result)
        );

        // We only log if an actual transition happened
        const didTransition = stateEffect !== newStateEffect;

        if (debugging.active && didTransition && hasPendingAction) {
          console.groupCollapsed(
            "\x1B[30;101;1m " +
              stateEffect[0].status +
              " \x1B[m => " +
              "\x1B[30;102;1m " +
              action.type +
              " \x1B[m => [ " +
              "\x1B[30;101;1m " +
              newStateEffect[0].status +
              " \x1B[m" +
              (newStateEffect[1]
                ? " , \x1B[30;103;1m " + newStateEffect[1].type + " \x1B[m ] "
                : " , null " + "\x1B[m]")
          );
          console.log({
            prevState: stateEffect[0],
            nextState: newStateEffect[0],
            effect: newStateEffect[1],
          });
          console.groupEnd();
        } else if (debugging.active && !didTransition && hasPendingAction) {
          console.log(
            "\x1B[30;101;1m " +
              stateEffect[0].status +
              " \x1B[m => " +
              "\x1B[30;102;1m " +
              action.type +
              " \x1B[m => IGNORED"
          );
        }

        hasPendingAction = false;

        return newStateEffect;
      },
      [initialState, null]
    );

    useEffect(() => exec(effect, effects), [effect]);

    return useMemo(
      () => [
        state,
        (action: A) => {
          hasPendingAction = true;
          dispatch(action);
        },
      ],
      [state]
    );
  };
}
