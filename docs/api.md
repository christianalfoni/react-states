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
- [ReturnTypes](#returntypes)
- [PickState](#pickstate)
- [PickAction](#pickaction)
- [PickCommand](#pickcommand)

Devtools

- [DevtoolsProvider](#devtoolsprovider)
- [useDevtools](#usedevtools)

## Core

### transition

Transition state and action in a reducer

```ts
import { transition, TTransitions, ReturnTypes, IAction, IState } from 'react-states';

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
  BAR = () => ({
    state: 'BAR' as const,
    ...actions,
  }),
};

type State = ReturnTypes<typeof states, IState>;

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
import { transition, TTransitions, ReturnTypes, IState, IAction, ICommand, $COMMAND } from 'react-states';

const actions = {
  SWITCH: () => ({
    type: 'SWITCH' as const,
  }),
};

type Action = ReturnTypes<typeof actions, IAction>;

const commands = {
  LOG: (message: string) => ({
    cmd: 'LOG' as const,
    message,
  }),
};

type Command = ReturnTypes<typeof commands, ICommand>;

const states = {
  FOO: () => ({
    state: 'FOO' as const,
    [$COMMAND]: commands.LOG('Moved into FOO'),
    ...actions,
  }),
  BAR: () => ({
    state: 'BAR' as const,
    [$COMMAND]: commands.LOG('Moved into BAR'),
    ...actions,
  }),
};

type State = ReturnTypes<typeof states, IState>;

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

  useCommandEffect(state, 'LOG', ({ message }) => {
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
import { transition, TTransitions, ReturnTypes, IAction, IState } from 'react-states';

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
  BAR = () => ({
    state: 'BAR' as const,
    ...actions,
  }),
};

type State = ReturnTypes<typeof states, IState>;

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
import { transition, TTransitions, TTransition, ReturnTypes, IAction, IState } from 'react-states';

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
  BAR = () => ({
    state: 'BAR' as const,
    ...actions,
  }),
};

type State = ReturnTypes<typeof states, IState>;

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

### ReturnTypes

Point to a record of state/action/command creators and create a union of their return types. Gives `unknown` when invalid types returned.

```ts
const actions = {
  DO_THIS: () => ({
    type: 'DO_THIS' as const,
  }),
  DO_THAT: () => ({
    type: 'DO_THAT' as const,
  }),
};

type Action = ReturnTypes<typeof actions, IAction>;
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
