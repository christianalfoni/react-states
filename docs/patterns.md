# Patterns

- [Creators](#Creators)
- [Hook](#Hook)

## Creators

Defining the different creators.

```ts
import { ReturnTypes, IAction, ICommand, IState, PickCommand, pick } from 'react-states';

const actions = {
  // Use single params argument and destructure to
  // ensure exact return value
  ACTION_A: ({ foo, bar }: { foo: string; bar: string }) => ({
    type: 'ACTION_A' as const,
    foo,
    bar,
  }),
};

type Action = ReturnTypes<typeof actions, IAction>;

const commands = {
  // Prefix with "$"
  $COMMAND_A: () => ({
    cmd: '$COMMAND_A' as const,
  }),
  // Use single params argument and desctructure to
  // ensure exact return value
  $COMMAND_B: ({ foo, bar }: { foo: string; bar: string }) => ({
    type: 'COMMAND_B' as const,
    foo,
    bar,
  }),
};

type Command = PickReturnType<typeof commands, ICommand>;

const states = {
  // Use single params argument and destructure to
  // ensure exact return value
  STATE_A: ({ foo, bar }: { foo: string; bar: string }) => ({
    state: 'STATE_A' as const,
    foo,
    bar,
  }),
  // Use second argument for commands
  STATE_B: ({ foo, bar }: { foo: string; bar: string }, command?: PickCommand<Command, 'COMMAND_A'>) => ({
    state: 'STATE_B' as const,
    foo,
    bar,
    [$COMMAND]: command,
  }),
  STATE_C: ({ foo, bar }: { foo: string; bar: string }) => ({
    state: 'STATE_C' as const,
    foo,
    bar,
    // When always firing a command, include it directly
    [$COMMAND]: commands.$COMMAND_B({ foo: 'foo', bar: 'bar' }),
  }),
  // Include actions by spreading all or pick utility
  STATE_D: ({ foo, bar }: { foo: string; bar: string }) => ({
    state: 'STATE_D' as const,
    foo,
    bar,
    // Include all actions
    ...actions,
    // Pick certain ones
    ...pick(actions, 'ACTION_A', 'ACTION_B'),
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
