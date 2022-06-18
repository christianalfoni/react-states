# Patterns

- [Exact State](#Exact-State)
- [Creators](#Creators)
- [Hook](#Hook)
- [Lift Transitions](#lift-transitions)
- [BaseState](#BaseState)
- [Environment Interface](#Environment-Interface)

## Exact State

To ensure exact return type from handlers, use `PickState`. This ensures adding invalid properties are flagged and transition inference works as expected.

```ts
const transitions: TTransitions<State, Action> = {
  FOO: {
    SWITCH: (): PickState<State, 'BAR'> => ({
      state: 'BAR',
    }),
  },
  BAR: {
    SWITCH: (): PickState<State, 'FOO'> => ({
      state: 'FOO',
    }),
  },
};
```

## Creators

Instead of defining your state and actions with explicit types you can create state/action creators instead. This gives additional type safety by protecting against invalid spreading and gives explicit return types. It also allow action creators to be exposed through your state.

```ts
const actions = {
  ACTION_A: (params: { foo: string; bar: string }) => ({
    type: 'ACTION_A' as const,
  }),
  ACTION_B: (params: { foo: string; bar: string }) => ({
    type: 'ACTION_B' as const,
  }),
};

type Action = ReturnType<typeof actions[keyof typeof actions]>;

const states = {
  // First argument is state related values and should always be
  // destructured. This protects against TypeScript not protecting
  // invalid spreading
  STATE_A: ({ foo, bar }: { foo: string; bar: string }) => ({
    state: 'STATE_A' as const,
    foo,
    bar,
  }),
};

type State = ReturnType<typeof states[keyof typeof states]>;
```

You can include action creators with the state to emphasize what actions are available in what states.

```ts
const actions = {
  ACTION_A: (params: { foo: string; bar: string }) => ({
    type: 'ACTION_A' as const,
  }),
};

type Action = ReturnType<typeof actions[keyof typeof actions]>;

const states = {
  STATE_A: ({ foo, bar }: { foo: string; bar: string }) => ({
    state: 'STATE_A' as const,
    foo,
    bar,
    ACITON_A: actions.ACTION_A,
  }),
};

type State = ReturnType<typeof states[keyof typeof states]>;
```

```tsx
const [state, dispatch] = useReducer(reducer);

dispatch(state.ACTION_A({ foo: 'foo', bar: 'bar' }));
```

## Hook

Expose the reducer and related effects as a hook.

```tsx
import { useReducer } from 'react';
import { transition, TTransitions, useEnter } from 'react-states';

type State =
  | {
      state: 'FOO';
    }
  | {
      state: 'BAR';
    };

type Action = {
  type: 'SWITCH';
};

const transitions: TTransitions<State, Action> = {
  FOO: {
    SWITCH: () => ({
      state: 'BAR',
    }),
  },
  BAR: {
    SWITCH: () => ({
      state: 'FOO',
    }),
  },
};

const reducer = (state: State, action: Action) => transition(state, action, transitions);

// Allow setting initialState for more reusability and also
// improved testability
export const useSwitcher = (initialState?: State) => {
  const switcherReducer = useReducer(reducer, initialState || FOO());

  useDevtools('Switcher', switcherReducer);

  const [state] = switcherReducer;

  useEnter(state, 'BAR', () => {
    console.log('Switched to BAR');
  });

  return switcherReducer;
};
```

### Lift Transitions

```ts
import { transition, TTransitions, TTransition, ReturnTypes, PickState, IState, pick } from 'react-states';

type Action =
  | {
      type: 'GO_TO_FOO';
    }
  | {
      type: 'GO_TO_BAR';
    }
  | {
      type: 'GO_TO_BAZ';
    };

type State =
  | {
      state: 'FOO';
    }
  | {
      state: 'BAR';
    }
  | {
      state: 'BAZ';
    };

// A single transition to be used in any state
const GO_TO_FOO = (state: State) => FOO();

// Multiple transitions to be used in any state
const baseTransitions: TTransition<State, Action> = {
  GO_TO_FOO: () => ({
    state: 'FOO',
  }),
  GO_TO_BAR: () => ({
    state: 'BAR',
  }),
};

// Multiple transitions to be used in specific states
const fooBarTransitions: TTransition<State, Action, 'FOO' | 'BAR'> = {
  GO_TO_FOO: () => ({
    state: 'FOO',
  }),
  GO_TO_BAR: () => ({
    state: 'BAR',
  }),
};

// All transitions
const transitions: TTransitions<State, Action> = {
  FOO: {
    ...baseTransitions,
    ...fooBarTransitions,
    GO_TO_FOO,
  },
  BAR: {
    ...baseTransitions,
    ...fooBarTransitions,
    GO_TO_FOO,
  },
  BAZ: {
    ...baseTransitions,
    GO_TO_FOO,
  },
};
```

### BaseState

When you work with complex state it can be a good idea to define all possible values across states and then rather pick which one is being used in either state. This improves reusability and reduces duplication.

```ts
type BaseState = {
  foo: string;
  bar: number;
  baz: boolean;
};

type State =
  | ({
      state: 'FOO';
    } & Pick<BaseState, 'foo' | 'bar'>)
  | ({
      state: 'BAR';
    } & Pick<BaseState, 'foo' | 'baz'>);
```
