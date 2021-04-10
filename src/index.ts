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

export type StatesReducer<C extends TContext, A extends TAction> = [C, React.Dispatch<A>];

export type PickState<C extends { state: string }, SS extends C['state']> = C extends { state: SS } ? C : never;

export type PickAction<E extends { type: string }, T extends E['type']> = E extends { type: T } ? E : never;

export const transitions = <C extends TContext, A extends TAction>(
  transitions: {
    [State in C['state']]: {
      [Type in A['type']]?: (action: A & { type: Type }, context: C & { state: State }) => C;
    };
  },
): ((context: C, action: A) => C) => (context, action) => {
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

export const exec = <C extends TContext>(context: C, effects: TEffects<C>) => {
  // @ts-ignore
  if (effects[context.state]) {
    // @ts-ignore
    return context[DEBUG_EXEC] ? context[DEBUG_EXEC](effects[context.state]) : effects[context.state](context);
  }
};

export const match = <C extends TContext, T extends TMatch<C>>(
  context: C,
  matches: T,
): {
  [K in keyof T]: T[K] extends () => infer R ? R : never;
  // @ts-ignore
}[keyof T] => (matches[context.state] ? matches[context.state](context) : null);
