# Patterns

- [Hook](#Hook)
- [Lift Transitions](#lift-transitions)
- [BaseState](#BaseState)

## Hook

Expose the reducer and related effects as a hook.

```tsx
import { useReducer } from 'react';
import { transition, useStateTransition } from 'react-states';

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

const reducer = (prevState: State, action: Action) =>
  transition(prevState, action, {
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
  });

// Allow setting initialState for more reusability and also
// improved testability
export const useSwitcher = (initialState?: State) => {
  const switcherReducer = useReducer(
    reducer,
    initialState || {
      state: 'FOO',
    },
  );

  useDevtools('Switcher', switcherReducer);

  const [state] = switcherReducer;

  useStateTransition(state, 'BAR', () => {
    console.log('Switched to BAR');
  });

  return switcherReducer;
};
```

### Lift Transitions

```ts
import { PickState, PickAction } from 'react-states';

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

// A single transition to be used in any state. Be explicit about return type
const GO_TO_FOO = (state: State, action: PickAction<Action, 'SWITCH'>): PickState<State, 'FOO'> => ({
  state: 'FOO',
});
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
