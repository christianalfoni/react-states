# Patterns

- [Hook](#Hook)
- [Lift Transitions](#lift-transitions)
- [BaseState](#BaseState)

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
