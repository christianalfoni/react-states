# API

- [Factories](#factories)
    - [createReducer](#createreducer)
  - [defineEnvironment](#defineenvironment)
    - [createEnvironment](#createenvironment)
    - [EnvironmentProvider](#environmentprovider)
    - [useEnvironment](#useenvironment)
    - [createReducer](#createreducer-1)
    - [useReducer](#usereducer)
- [Effects](#effects)
  - [useStateEffect](#usestateeffect)
  - [useCommandEffect](#usecommandeffect)
- [Utils](#utils)
  - [match](#match)
  - [renderReducer](#renderreducer)
- [Type Utils](#type-utils)
  - [States](#states)
  - [StatesHandlers](#stateshandlers)
  - [StatesTransition](#statestransition)
  - [Emit](#emit)
  - [PickState](#pickstate)
  - [PickAction](#pickaction)
  - [PickCommand](#pickcommand)
- [Devtools](#devtools)
  - [DevtoolsProvider](#devtoolsprovider)
  - [useDevtools](#usedevtools)

## Factories

#### createReducer

Create a plain reducer, not typed to any environment events

```ts
import { createReducer, States, StatesTransition } from 'react-states';

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

type Command = {
  cmd: 'LOG';
  message: string;
};

// Command is optional
type Switcher = States<State, Action, Command>;

type Transition = StatesTransition<Switcher>;

const reducer = createReducer<Switcher>({
  FOO: {
    SWITCH: (currentState, action): Transition => ({
      state: 'BAR',
    }),
  },
  BAR: {
    SWITCH: (currentState, action): Transition => [{ state: 'FOO' }, { cmd: 'LOG', message: 'Switched from BAR' }],
  },
});
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

#### createEnvironment

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

#### EnvironmentProvider

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

#### useEnvironment

Use the environment interface.

```tsx
import { useEnvironment } from './environment';

export const SomeComponent: React.FC = () => {
  const { someApi } = useEnvironment();

  return <div />;
};
```

#### createReducer

Creates a reducer typed to the environment. The handlers can be any environment event in addition to actions.

```ts
import { States, StatesTransition } from 'react-states';
import { createReducer } from './environment';

type State =
  | {
      state: 'STATE_A';
    }
  | {
      state: 'STATE_B';
    };

type Action = {
  type: 'SWITCH';
};

type Switcher = States<State, Action>;

type Transition = StatesTransition<Switcher>;

const reducer = createReducer<Switcher>({
  STATE_A: {
    // Event from the environment
    SOME_EVENT: (): Transition => ({ state: 'STATE_B' }),
  },
  STATE_B: {
    SWITCH: (currentState, action): Transition => ({ state: 'FOO' }),
  },
});
```

#### useReducer

Use a reducer tied to the environment, meaning it will receive any events from the environment in addition to its dispatched actions.

```tsx
import { useReducer } from './environment';
import { reducer } from './reducer';

export const SomeComponent: React.FC = () => {
  // Subscribes to environment events
  const [state, dispatch] = useReducer('some-name', reducer, { state: 'STATE_A' });

  return <div />;
};
```

## Effects

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

  useCommandEffect(state, 'SOME_COMMAND', () => {
    // Run when command is part of transition
  });

  return null;
};
```

## Utils

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

### renderReducer

```tsx
import { act } from '@testing-library/react';
import { renderReducer } from 'react-states/test';
import { createEnvironment } from './environment/test';

it('should do something', () => {
  const environment = createEnvironment();
  const [state, dispatch] = renderReducer(
    () => useReducer(reducer, { state: 'FOO' }),
    (Reducer) => (
      <EnvironmentProvider environment={environment}>
        <Reducer />
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

## Type Utils

### States

A type representing the states reducer.

```ts
import { States } from 'react-states';

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

type Command = {
  cmd: 'LOG';
  message: string;
};

type SomeStatesType = States<State, Action, Command>;
```

### StatesHandlers

Narrows to specific handlers.

```ts
import { StatesHandlers, createReducer } from 'react-states';

const generalHandlers: StateHandlers<SomeStatesType> = {
  // Handlers for any state
};

const fooHandlers: StateHandlers<SomeStatesType, 'FOO'> = {
  // Handlers for this specific state
};

const reducer = createReducer<SomeStatesType>({
  FOO: {
    ...generalHandlers,
    ...fooHandlers,
  },
});
```

### StatesTransition

Defines the exact return type for handlers. This is needed until TypeScript offers inferred exact return types.

```ts
import { StatesTransition, createReducer } from 'react-states';

type Transition = StatesTransition<SomeStatesType>;

const reducer = createReducer<SomeStatesType>({
  FOO: {
    SOME_ACTION: (): Transition => ({
      state: 'BAR',
    }),
  },
  BAR: {},
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
type NarrowedStates = PickState<SomeStatesType, 'A' | 'B'>;
```

### PickAction

Narrows to specific actions.

```ts
type NarrowedActions = PickAction<SomeStatesType, 'A' | 'B'>;
```

### PickCommand

Narrows to specific commands. **Note** it will return a `TState` shape of the commands,
not `TCommand`.

```ts
type NarrowedCommands = PickCommand<SomeStatesType, 'C-A' | 'C-B'>;
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
