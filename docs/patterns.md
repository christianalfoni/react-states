# Patterns

- [Creators](#Creators)
- [Hook](#Hook)

## Creators

Defining the different creators.

```ts
import { ReturnTypes, IAction, ICommand, IState, PickCommand, pick } from 'react-states';

const actions = {
  ACTION_A: (params: { foo: string; bar: string }) => ({
    type: 'ACTION_A' as const,
    ...params,
  }),
};

type Action = ReturnTypes<typeof actions, IAction>;

const commands = {
  COMMAND_A: (someValue: string) => ({
    cmd: 'COMMAND_B' as const,
    someValue,
  }),
};

type Command = PickReturnType<typeof commands, ICommand>;

const states = {
  // First argument is state related values.
  STATE_A: (params: { foo: string; bar: string }) => ({
    state: 'STATE_A' as const,
    ...params,
  }),
  // Use second argument for commands
  STATE_B: (params: { foo: string; bar: string }, command?: PickCommand<Command, 'COMMAND_A'>) => ({
    state: 'STATE_B' as const,
    [$COMMAND]: command,
    ...params,
  }),
  // When always firing a command, include it directly
  STATE_C: (params: { foo: string; bar: string }) => ({
    state: 'STATE_C' as const,
    [$COMMAND]: commands.COMMAND_A({ foo: 'foo', bar: 'bar' }),
    ...params,
  }),
  // Include actions by spreading all or use pick utility
  STATE_D: (params: { foo: string; bar: string }) => ({
    state: 'STATE_D' as const,
    // Include all actions
    ...actions,
    // Pick certain ones
    ...pick(actions, 'ACTION_A', 'ACTION_B'),
    ...params,
  }),
};
```

## Hook

Expose the reducer and related effects as a hook.

```tsx
import { useReducer } from 'react';
import { transition, TTransitions, useStateEffect, IAction, IState, ReturnTypes } from 'react-states';

const actions = {
  SWITCH: () => ({
    type: 'SWITCH' as const,
  }),
};

type Action = ReturnTypes<typeof actions, IAction>;

const states = {
  FOO: () => ({
    state: 'FOO' as const,
    ...actions,
  }),
  BAR: () => ({
    state: 'BAR' as const,
    ...actions,
  }),
};

type State = ReturnTypes<typeof states, IState>;

// Destructure and export states to set initial state from
// outside and more explicitly express transitions
export const { FOO, BAR } = states;

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
