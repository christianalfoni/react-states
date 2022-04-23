# API

Core

- [transition](#transition)
- [useStateEffect](#usestateeffect)
- [match](#match)
- [matchProp](#matchprop)
- [useCommandEffect](#usecommandeffect)

Environment

- [defineEnvironment](#defineenvironment)
- [createEnvironment](#createenvironment)
- [EnvironmentProvider](#environmentprovider)
- [useEnvironment](#useenvironment)

Testing

- [renderReducer](#renderreducer)

Types and Type Utils

- [TTransitions](#TTransitions)
- [TTransition](#TTransition)
- [TEmit](#TEmit)
- [PickReturnTypes](#pickreturntypes)
- [PickState](#pickstate)
- [PickAction](#pickaction)
- [PickCommand](#pickcommand)
- [PickStateCommand](#pickstatecommand)

Devtools

- [DevtoolsProvider](#devtoolsprovider)
- [useDevtools](#usedevtools)

## Core

### transition

Transition state and action in a reducer

```ts
import { transition, TTransitions, PickReturnTypes, IAction, IState } from 'react-states';

const actions = {
  SWITCH: () => ({
    type: 'SWITCH' as const,
  }),
};

type Action = PickReturnTypes<typeof actions, IAction>;

const states = {
  FOO: () => ({
    state: 'FOO' as const,
    SWITCH: actions.SWITCH,
  }),
  BAR = () => ({
    state: 'BAR' as const,
    SWITCH: actions.SWITCH,
  }),
};

type State = PickReturnTypes<typeof states, IState>;

export const { FOO, BAR } = states;

const transitions: TTransitions<State, Action> = {
  FOO: {
    SWITCH: (state, action) => BAR(),
  },
  BAR: {
    SWITCH: (state, action) => FOO(),
  },
};

const reducer = (state: State, action: Action) => transition(state, action, transitions);
```

### useStateEffect

Run an effect when entering a specific state.

```ts
const SomeComponent = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useStateEffect(state, 'FOO', () => {
    // Run when entering state
    return () => {
      // Dispose when exiting the state
    };
  });

  useStateEffect(state, ['FOO', 'BAR'], () => {
    // Run when entering either state
    return () => {
      // Dispose when exiting to other state
    };
  });

  return null;
};
```

### match

```tsx
const SomeComponent = () => {
  const [state, dispatch] = useReducer(reducer, FOO());

  return match(state, {
    FOO: ({ SWITCH }) => <div onClick={() => dispatch(SWITCH())}>FOO</div>,
    BAR: ({ SWITCH }) => <div onClick={() => dispatch(SWITCH())}>BAR</div>,
  });
};
```

### matchProp

```ts
const SomeComponent = () => {
  const [state, dispatch] = useReducer(reducer, FOO());

  return matchProp(state, 'someProp')?.someProp ?? 'Not there';
};
```

### useCommandEffect

Run an effect when the command is part of a transition.

```ts
import { transition, TTransitions, PickReturnTypes, IState, IAction, ICommand } from 'react-states';

const actions = {
  SWITCH: () => ({
    type: 'SWITCH' as const,
  }),
};

type Action = PickReturnTypes<typeof actions, IAction>;

const commands = {
  $LOG: (message: string) => ({
    cmd: '$LOG' as const,
    message,
  }),
};

type Command = PickReturnTypes<typeof commands, ICommand>;

const states = {
  FOO: () => ({
    state: 'FOO' as const,
    SWITCH: actions.SWITCH,
    $LOG: $LOG('Moved into FOO'),
  }),
  BAR: () => ({
    state: 'BAR' as const,
    SWITCH: actions.SWITCH,
    $LOG: $LOG('Moved into BAR'),
  }),
};

type State = PickReturnTypes<typeof states, IState>;

const transitions: TTransitions<State, Action> = {
  FOO: {
    SWITCH: (state, action) => BAR(),
  },
  BAR: {
    SWITCH: (state, action) => FOO(),
  },
};

const reducer = (state: State, action: Action) => transition(state, action, transitions);
```

```ts
const SomeComponent = () => {
  const [state, dispatch] = useReducer(reducer, FOO());

  useCommandEffect(state, '$LOG', ({ message }) => {
    console.log(message);
  });

  return null;
};
```

### defineEnvironment

Define an environment with its interface and any events to emit

```tsx
import { defineEnvironment } from 'react-states';

export type EnvironmentEvent = {
  type: 'DID_SOMETHING';
};

export type Environment = {
  someApi: {
    doSomething(): void;
  };
};

export const { createEnvironment, EnvironmentProvider, useEnvironment } = defineEnvironment<
  Environment,
  EnvironmentEvent
>();
```

### createEnvironment

Create a specific implementation of the environment interface,
where you can emit events.

```ts
import { createEnvironment } from './environment-interface';

export const environment = createEnvironment((emit) => ({
  someApi: {
    doSomething() {
      emit({ type: 'DID_SOMETHING' });
    },
  },
}));
```

### EnvironmentProvider

Expose a specific environment to the application.

```tsx
import { EnvironmentProvider } from './environment-interface';
import { environment } from './environments/browser';

export const AppWrapper: React.FC = () => {
  return (
    <EnvironmentProvider environment={environment}>
      <App />
    </EnvironmentProvider>
  );
};
```

### useEnvironment

Use the environment interface.

```tsx
import { useEnvironment } from './environment-interface';

export const SomeComponent: React.FC = () => {
  const { someApi, emitter } = useEnvironment();
  const [state, dispatch] = useReducer(reducer, FOO());

  // Dispatch environment actions into reducer
  useEffect(() => emitter.subscribe(dispatch), []);

  return <div />;
};
```

## Testing

### renderReducer

```tsx
import { act } from '@testing-library/react';
import { renderReducer } from 'react-states/test';
import { createEnvironment } from './environments/test';

it('should do something', () => {
  const environment = createEnvironment();
  const [state, dispatch] = renderReducer(
    () => useSwitcher(),
    (Switcher) => (
      <EnvironmentProvider environment={environment}>
        <Switcher />
      </EnvironmentProvider>
    ),
  );

  act(() => {
    dispatch({ type: 'SWITCH' });
  });

  expect(state.state).toBe('BAR');

  act(() => {
    environment.emitter.emit({
      type: 'SOME_EVENT',
    });
  });

  expect(state.state).toBe('BAZ');
});
```

## Utils

### TTransitions

Types the object with all states and handlers

```ts
import { transition, TTransitions, PickReturnTypes, IAction, IState } from 'react-states';

const actions = {
  SWITCH: () => ({
    type: 'SWITCH' as const,
  }),
};

type Action = PickReturnTypes<typeof actions, IAction>;

const states = {
  FOO: () => ({
    state: 'FOO' as const,
    SWITCH: actions.SWITCH,
  }),
  BAR = () => ({
    state: 'BAR' as const,
    SWITCH: actions.SWITCH,
  }),
};

type State = PickReturnTypes<typeof states, IState>;

export const { FOO, BAR } = states;

const transitions: TTransitions<State, Action> = {
  FOO: {
    SWITCH: (state, action) => BAR(),
  },
  BAR: {
    SWITCH: (state, action) => FOO(),
  },
};
```

### TTransition

Types the object with a specific state and its transitions

```ts
import { transition, TTransitions, TTransition, PickReturnTypes, IAction, IState } from 'react-states';

const actions = {
  SWITCH: () => ({
    type: 'SWITCH' as const,
  }),
};

type Action = PickReturnTypes<typeof actions, IAction>;

const states = {
  FOO: () => ({
    state: 'FOO' as const,
    SWITCH: actions.SWITCH,
  }),
  BAR = () => ({
    state: 'BAR' as const,
    SWITCH: actions.SWITCH,
  }),
};

type State = PickReturnTypes<typeof states, IState>;

export const { FOO, BAR } = states;

const fooTransitions: TTransition<State, Action, 'FOO'> = {
  SWITCH: (state, action) => BAR(),
};

const transitions: TTransitions<State, Action> = {
  FOO: fooTransitions,
  BAR: {
    SWITCH: () => FOO(),
  },
};
```

### TEmit

Type the emitter when creating environment.

```ts
import { TEmit } from 'react-states';
import { SomeApi, SomeApiEvent } from '../environment-interface/someApi';

export const someApi = (emit: TEmit<SomeApiEvent>): SomeApi => ({
  doThis() {
    emit({ type: 'FOO' });
  },
});
```

### PickReturnTypes<typeof states, T>

Point to a record of state/action/command factories and create a union of their return types. Gives `unknown` when invalid types returned.

```ts
const actions = {
  DO_THIS: () => ({
    type: 'DO_THIS',
  }),
  DO_THAT: () => ({
    type: 'DO_THAT',
  }),
};

type Action = PickReturnType<typeof actions, IAction>;
```

### PickState

Narrows to specific states.

```ts
type NarrowedStates = PickState<State, 'A' | 'B'>;
```

### PickAction

Narrows to specific actions.

```ts
type NarrowedActions = PickAction<Action, 'A' | 'B'>;
```

### PickCommand

Narrows to specific command.

```ts
type NarrowedCommands = PickCommand<Command, 'A' | 'B'>;
```

### PickCommandState

Narrows to specific states which has the commands.

```ts
type NarrowedCommandStates = PickCommandStates<SomeState, 'C-A' | 'C-B'>;
```

## Devtools

### DevtoolsProvider

Expose the devtools manager and the UI.

```tsx
import { DevtoolsProvider } from 'react-states/devtools';

export const AppWrapper: React.FC = () => {
  return (
    <DevtoolsProvider>
      <App />
    </DevtoolsProvider>
  );
};
```

### useDevtools

Manually expose the reducer on the devtools. **Note!** the `useReducer` from the environment does this automatically.

```tsx
import { useReducer } from 'react';
import { useDevtools } from 'react-states/devtools';

export const SomeComponent: React.FC = () => {
  const switchReducer = useReducer(reducer, FOO());

  useDevtools('Switch', switchReducer);

  const [state, dispatch] = switchReducer;
};
```
