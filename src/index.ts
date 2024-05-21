import { useEffect, useMemo, useReducer } from "react";

export const debugging = {
  active: false,
};

type TState = {
  state: string;
};

type TCmd = {
  cmd: string;
};

type TAction = {
  type: string;
};

type StateCmd = [TState, TCmd | null];

type TTransitions<S extends StateCmd, A extends TAction> = {
  [SS in S[0]["state"]]: {
    [AA in A["type"]]?: (
      action: A & { type: AA },
      state: S[0] & { state: SS }
    ) => S[0] | S;
  };
};

export function transition<const S extends StateCmd, const A extends TAction>(
  stateCmd: S,
  action: A,
  transitions: TTransitions<S, A>
): S {
  const [state] = stateCmd;
  const result =
    transitions[state.state as S[0]["state"]]?.[action.type as A["type"]]?.(
      action,
      state
    ) ?? stateCmd;

  return Array.isArray(result) ? result : ([result, null] as S);
}

export function exec<
  C extends TCmd,
  T extends {
    [CC in C["cmd"]]: (cmd: C & { cmd: CC }) => void;
  }
>(cmd: C | null, commands: T) {
  if (!cmd || !commands[cmd.cmd as C["cmd"]]) {
    return;
  }

  return commands[cmd.cmd as C["cmd"]](cmd);
}

export type TMatch<S extends TState, R = any> = {
  [SS in S["state"]]: (state: S & { state: SS }) => R;
};

export type TPartialMatch<S extends TState, R = any> = {
  [SS in S["state"]]?: (state: S & { state: SS }) => R;
};
export function match<
  S extends TState,
  P extends {
    [K in keyof S]: keyof (S & { state: K });
  }[keyof S]
>(state: S, prop: P): S extends Record<P, unknown> ? S : undefined;
export function match<S extends TState, T extends TMatch<S>>(
  state: S,
  matches: T
): {
  [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never;
}[keyof T];
export function match<S extends TState, T extends TPartialMatch<S>, U>(
  state: S,
  matches: T,
  _: (state: S & { state: Exclude<S["state"], keyof T> }) => U
):
  | {
      [K in keyof T]: T[K] extends (...args: any[]) => infer R ? R : never;
    }[keyof T]
  | U;
export function match() {
  const state = arguments[0];
  const matches = arguments[1];
  const _ = arguments[2];

  if (typeof matches === "string") {
    return matches in state ? state : undefined;
  }

  if (_) {
    return (matches[state.state] || _)(state);
  }

  return matches[state.state](state);
}

export function createTransitions<
  S extends TState,
  A extends TAction,
  C extends TCmd
>(
  transitions: (
    transition: (state: S, cmd?: C) => [S, C | null]
  ) => TTransitions<[S, C | null], A>
) {
  // Tracks dispatches so that the debugger does not give
  // duplicate logs during strict mode
  let hasPendingAction = false;

  const result = (state: S, cmd?: C) => {
    return [state, cmd || null] as [S, C | null];
  };

  return (
    commands: {
      [CC in C["cmd"]]: (cmd: C & { cmd: CC }) => void;
    },
    initialState: S
  ): [S, (action: A) => void] => {
    const [[state, cmd], dispatch] = useReducer(
      (stateCmd: [S, C | null], action: A) => {
        const newStateCmd = transition<[S, C | null], A>(
          stateCmd,
          action,
          transitions(result)
        );

        // We only log if an actual transition happened
        const didTransition = stateCmd !== newStateCmd;

        if (debugging.active && didTransition && hasPendingAction) {
          console.groupCollapsed(
            "\x1B[30;43;1m " +
              stateCmd[0].state +
              " \x1B[m => " +
              "\x1B[30;105;1m " +
              action.type +
              " \x1B[m => [ " +
              "\x1B[30;43;1m " +
              newStateCmd[0].state +
              " \x1B[m" +
              (newStateCmd[1]
                ? " , \x1B[30;103;1m " + newStateCmd[1].cmd + " \x1B[m ] "
                : " , null " + "\x1B[m]")
          );
          console.log({
            prevState: stateCmd[0],
            nextState: newStateCmd[0],
            cmd: newStateCmd[1],
          });
          console.groupEnd();
        } else if (debugging.active && !didTransition && hasPendingAction) {
          console.log(
            "\x1B[30;43;1m " +
              stateCmd[0].state +
              " \x1B[m => " +
              "\x1B[30;105;1m " +
              action.type +
              " \x1B[m => IGNORED"
          );
        }

        hasPendingAction = false;

        return newStateCmd;
      },
      [initialState, null]
    );

    useEffect(() => exec(cmd, commands), [cmd]);

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
