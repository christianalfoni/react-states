# Patterns

- [Creators](#Creators)
- [Hook](#Hook)
- [BaseState](#BaseState)
- [Lift Transitions](#lift-transitions)

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
  // First argument is state related values and should always be
  // destructured as spreading can cause invalid values to be inserted/override
  // state
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
  // When always firing a command, include it directly
  STATE_C: ({ foo, bar }: { foo: string; bar: string }) => ({
    state: 'STATE_C' as const,
    foo,
    bar,
    [$COMMAND]: commands.COMMAND_A({ foo: 'foo', bar: 'bar' }),
  }),
  // Include actions by spreading all or use pick utility
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

### BaseState

When you work with complex state it can be a good idea to define all possible values across states and then rather pick which one is being used in either state. This improves reusability and reduces duplication.

```ts
type BaseState = {
  foo: string;
  bar: number;
  baz: boolean;
};

const states = {
  STATE_A: ({ foo, bar }: Pick<BaseState, 'foo' | 'bar'>) => ({
    state: 'STATE_A' as const,
    foo,
    bar,
  }),
  STATE_B: ({ foo, baz }: Pick<BaseState, 'foo' | 'baz'>) => ({
    state: 'STATE_B' as const,
    foo,
    baz,
  }),
};
```

### Lift Transitions

```ts
import { transition, TTransitions, TTransition, ReturnTypes, PickState, IState, pick } from 'react-states';

const actions = {
  GO_TO_FOO: () => ({
    type: 'GO_TO_FOO' as const,
  }),
  GO_TO_BAR: () => ({
    type: 'GO_TO_BAR' as const,
  }),
  GO_TO_BAZ: () => ({
    type: 'GO_TO_BAZ' as const,
  }),
};

const states = {
  FOO: () => ({
    state: 'FOO' as const,
    ...actions,
  }),
  BAR: () => ({
    state: 'BAR' as const,
    ...actions,
  }),
  BAZ: () => ({
    state: 'BAZ' as const,
    ...actions,
  }),
};

type State = ReturnTypes<typeof states, IState>;

// A single transition to be used in any state
const GO_TO_FOO = (state: State) => FOO();

// Multiple transitions to be used in any state
const baseTransitions: TTransition<State, Action> = {
  GO_TO_FOO: () => FOO(),
  GO_TO_BAR: () => BAR(),
};

// Multiple transitions to be used in specific states
const fooBarTransitions: TTransition<State, Action, 'FOO' | 'BAR'> = {
  GO_TO_FOO: () => FOO(),
  GO_TO_BAR: () => BAR(),
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
