export * from './result';

export const DEBUG_IS_ACTION_IGNORED = Symbol('DEBUG_IS_ACTION_IGNORED');
export const DEBUG_TRANSITIONS = Symbol('DEBUG_TRANSITIONS');
export const DEBUG_EXEC = Symbol('DEBUG_EXEC');

export interface TContext {
  state: string;
}

export interface TAction {
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

export type TransitionsReducer<C extends TContext, A extends TAction> = [C, React.Dispatch<A>];

export type PickState<C extends { state: string }, SS extends C['state']> = C extends { state: SS } ? C : never;

export type PickAction<E extends { type: string }, T extends E['type']> = E extends { type: T } ? E : never;

export function transitions<C extends TContext, A extends TAction>(
  transitions: {
    [State in C['state']]: {
      [Type in A['type']]?: (action: A & { type: Type }, context: C & { state: State }) => C;
    };
  },
): (context: C, action: A) => C {
  return (context, action) => {
    let newContext = context;
    // @ts-ignore
    if (transitions[context.state] && transitions[context.state][action.type]) {
      // @ts-ignore
      newContext = transitions[context.state][action.type](action, context);
    } else {
      // @ts-ignore
      action[DEBUG_IS_ACTION_IGNORED] = true;
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

export function matches<C extends TContext, A extends TAction, S extends C['state']>(
  reducer: TransitionsReducer<C, A>,
  state: S | undefined,
): reducer is TransitionsReducer<C & { state: S }, A> {
  if (state && reducer[0].state === state) {
    return true;
  }

  throw new Error(`You can not use "${state}" as the current state is "${reducer[0].state}"`);
}
