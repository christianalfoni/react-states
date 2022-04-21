# API

Core

- [createReducer](#createreducer)
- [$COMMAND](#$COMMAND)
- [useStateEffect](#usestateeffect)
- [useCommandEffect](#usecommandeffect)
- [match](#match)

Environment

- [defineEnvironment](#defineenvironment)
- [createEnvironment](#createenvironment)
- [EnvironmentProvider](#environmentprovider)
- [useEnvironment](#useenvironment)
- [createReducer](#createreducer-1)
- [useReducer](#usereducer)

Testing

- [renderReducer](#renderreducer)

Utils

- [createReducerHandlers](#createReducerHandlers)
- [Emit](#emit)
- [PickState](#pickstate)
- [PickAction](#pickaction)
- [PickStateCommand](#pickstatecommand)
- [PickReturnTypes](#PickReturnTypes)

Devtools

- [DevtoolsProvider](#devtoolsprovider)
- [useDevtools](#usedevtools)

## Core

### createReducer

Create a reducer with explicit states

```ts
import { createReducer, PickReturnTypes } from 'react-states';

const states = {
  FOO = () => ({
    state: 'FOO' as const,
  }),
  BAR = () => ({
    state: 'BAR' as const,
  }),
};

type State = PickReturnTypes<typeof states>;

const actions = {
  SWITCH: () => ({
    type: 'SWITCH' as const,
  }),
};

type Action = PickReturnTypes<typeof actions>;

const reducer = createReducer<State, Action>({
  FOO: {
    SWITCH: (state, action) => BAR(),
  },
  BAR: {
    SWITCH: (state, action) => FOO(),
  },
});
```

### $COMMAND

Return a command to be executed by an effect

```ts
import { createReducer, $COMMAND } from 'react-states';

const $LOG = (message: string) => ({
  cmd: '$LOG' as const,
  message,
});


const FOO = () => ({
  state: 'FOO' as const,
  [$COMMAND]: $LOG('Moved to FOO')
});

const BAR = () => ({
  state: 'BAR' as const,
});


type State = ReturnType<typeof FOO | typeof BAR>;

type Action = {
  type: 'SWITCH';
};

const reducer = createReducer<State, Action>({
  FOO: {
    SWITCH: () => ({
      ...BAR()
      [$COMMAND]: $LOG('Moving to BAR')
    }),
  },
  BAR: {
    SWITCH: () => FOO(),
  },
});
```

### useStateEffect

Run an effect when entering a specific state.

```ts
const SomeComponent = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useStateEffect(state, 'SOME_STATE', () => {
    // Run when entering state
    return () => {
      // Dispose when exiting the state
    };
  });

  useStateEffect(state, ['SOME_STATE', 'SOME_OTHER_STATE'], () => {
    // Run when entering either state
    return () => {
      // Dispose when exiting to other state
    };
  });

  return null;
};
```

### useCommandEffect

Run an effect when the command is part of a transition.

```ts
const SomeComponent = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useCommandEffect(state, '$SOME_COMMAND', () => {
    // Run when command is part of transition
  });

  return null;
};
```

### match

```ts
const SomeComponent = () => {
  const [state, dispatch] = useReducer(reducer, {
    state: 'SOME_STATE',
  });

  return match(state, {
    SOME_STATE: () => 'Hello',
    OTHER_STATE: () => 'Ops',
  });
};
```

### defineEnvironment

Define an environment with its interface and any events to emit

```tsx
import { createEnvironment } from 'react-states';

export type EnvironmentEvent = {
  type: 'DID_SOMETHING';
};

export type Environment = {
  someApi: {
    doSomething(): void;
  };
};

export const { createEnvironment, EnvironmentProvider, useEnvironment, createReducer, useReducer } = defineEnvironment<
  Environment,
  EnvironmentEvent
>();
```

### createEnvironment

Create a specific implementation of the environment interface,
where you can emit events.

```ts
import { createEnvironment } from './environment';

export const browserEnvironment = createEnvironment((emit) => ({
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
import { EnvironmentProvider } from './environment';
import { environment } from './environment/browser';

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
import { useEnvironment } from './environment';

export const SomeComponent: React.FC = () => {
  const { someApi } = useEnvironment();

  return <div />;
};
```

### createReducer

Creates a reducer with explicit states typed to the environment. The handlers can be any environment event in addition to actions.

```ts
import { StatesReducer } from 'react-states';
import { createReducer } from './environment';

const STATE_A = () => ({
  state: 'STATE_A' as const,
});

const STATE_B = () => ({
  state: 'STATE_B' as const,
});

type State = ReturnType<typeof STATE_A | typeof STATE_B>;

type Action = {
  type: 'SWITCH';
};

const reducer = createReducer<State, Action>({
  STATE_A: {
    // Event from the environment
    SOME_EVENT: (state, event) => STATE_B(),
  },
  STATE_B: {
    SWITCH: (state, action) => STATE_A,
  },
});
```

### useReducer

Use a reducer tied to the environment, meaning it will receive any events from the environment in addition to its dispatched actions.

```tsx
import { useReducer } from './environment';
import { reducer } from './reducer';

export const SomeComponent: React.FC = () => {
  // Subscribes to environment events
  const [state, dispatch] = useReducer('some-name', reducer, STATE_A());

  return <div />;
};
```

## Testing

### renderReducer

```tsx
import { act } from '@testing-library/react';
import { renderReducer } from 'react-states/test';
import { createEnvironment } from './environment/test';

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

### createReducerHandlers

Create the handlers for all or specific states.

**NOTE!** When defining an environment, this util is exposed on the environment.

```ts
import { createReducerHandlers, createReducer } from 'react-states';

const FOO = () => ({
  state: 'FOO' as const,
});

const BAR = () => ({
  state: 'BAR' as const,
});

type State = ReturnType<typeof FOO | typeof BAR>;

type Action = {
  type: 'SWITCH';
};

// createReducerHandlers<State, Action, 'BAR'> for specific states
const handlers = createReducerHandlers<State, Action>({
  SWITCH: ({ state }) => (state.state === 'FOO' ? BAR() : FOO()),
});

const reducer = createReducer<State, Action>({
  FOO: handlers,
  BAR: handlers,
});
```

### Emit

Type the emitter when creating environment .

```ts
import { Emit } from 'react-states';

export type SomeApiEvent = {
  type: 'FOO';
};

export type SomeApi = {
  doThis(): void;
};

export const someApi = (emit: Emit<SomeApiEvent>): SomeApi => ({
  doThis() {
    emit({ type: 'FOO' });
  },
});
```

### PickState

Narrows to specific states.

```ts
type NarrowedStates = PickState<SomeState, 'A' | 'B'>;
```

### PickAction

Narrows to specific actions.

```ts
type NarrowedActions = PickAction<SomeAction, 'A' | 'B'>;
```

### PickCommandState

Narrows to specific states which has the commands.

```ts
type NarrowedCommands = PickCommandStates<SomeState, 'C-A' | 'C-B'>;
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
  const [state, dispatch] = useDevtools(
    'some-name',
    useReducer(reducer, {
      state: 'FOO',
    }),
  );
};
```
