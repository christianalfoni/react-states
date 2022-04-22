# Patterns

- [Hook](#Hook)

## Hook

Expose the reducer and related effects as a hook.

```tsx
import { useReducer } from 'react';
import { States, StateTransition, createReducer, useStateEffect } from 'react-states';

type Action = {
  type: 'SWITCH';
};

const FOO = () => ({
  state: 'FOO' as const,
});

const BAR = () => ({
  state: 'BAR' as const,
});

const transitions: TTransitions<State, Action> = {
  FOO: {
    SWITCH: () => BAR(),
  },
  BAR: {
    SWITCH: () => FOO(),
  },
};

const reducer = (state: State, action: Action) => transition(state, action, transitions);

type SwitcherProviderProps = {
  initialState?: State;
};

// Allow setting initialState for more reusability and also
// improved testability
export const useSwitcher = ({ initialState }: { initialState?: State }) => {
  const switcherReducer = useReducer(reducer, initialState || FOO());

  useDevtools('Switcher', switcherReducer);

  const [state] = switcherReducer;

  useStateEffect(state, 'BAR', () => {
    console.log('Switched to BAR');
  });

  return switcherReducer;
};
```
