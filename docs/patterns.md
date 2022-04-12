# Patterns

- [Hook](#Hook)

## Hook

Expose the reducer and related effects as a hook.

```tsx
import { useReducer } from 'react';
import { States, StateTransition, createReducer, useStateEffect } from 'react-states';

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

export type Switcher = States<State, Action>;

type Transition = StateTransition<Switcher>;

type SwitcherProviderProps = {
  initialState?: State;
};

const reducer = createReducer<Switcher>({
  FOO: {
    SWITCH: (): Transition => ({ state: 'BAR' }),
  },
  BAR: {
    SWITCH: (): Transition => ({ state: 'FOO' }),
  },
});

// Allow setting initialState for more reusability and also
// improved testability
export const useSwitcher = ({ initialState = { state: 'FOO' } }) => {
  const switcherReducer = useReducer(reducer, initialState);
  const [state] = switcherReducer;

  useStateEffect(state, 'BAR', () => {
    console.log('Switched to BAR');
  });

  return switcherReducer;
};
```
