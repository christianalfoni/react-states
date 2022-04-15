# API

Core

- [StatesReducer](#statesreducer)
- [createReducer](#createreducer)
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
- [transition](#transition)
- [noop](#noop)
- [Emit](#emit)
- [PickState](#pickstate)
- [PickAction](#pickaction)
- [PickCommand](#pickcommand)

Devtools

- [DevtoolsProvider](#devtoolsprovider)
- [useDevtools](#usedevtools)

## Core

### StatesReducer

A type representing the states reducer.

```ts
import { StatesReducer } from 'react-states';

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

// Commands and actions are optional
type SomeStatesType = StatesReducer<State, Action, Command>;
```

### createReducer

Create a reducer with explicit states

```ts
import { createReducer, StatesReducer, StatesTransition } from 'react-states';

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

type Switcher = StatesReducer<State, Action, Command>;

const reducer = createReducer<Switcher>({
  FOO: {
    SWITCH: ({ state, action }) => ({
      state: 'BAR',
    }),
  },
  BAR: {
    SWITCH: ({ state, action }) => [{ state: 'FOO' }, { cmd: 'LOG', message: 'Switched from BAR' }],
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

  useCommandEffect(state, 'SOME_COMMAND', () => {
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

type Switcher = StatesReducer<State, Action>;

const reducer = createReducer<Switcher>({
  STATE_A: {
    // Event from the environment
    SOME_EVENT: () => ({ state: 'STATE_B' }),
  },
  STATE_B: {
    SWITCH: (currentState, action) => ({ state: 'FOO' }),
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
  const [state, dispatch] = useReducer('some-name', reducer, { state: 'STATE_A' });

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
import { createReducerHandlers, createReducer, StatesReducer, StatesTransition } from 'react-states';

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

type Switcher = StatesReducer<State, Action>;

// createReducerHandlers<Switcher, 'BAR'> for specific states
const handlers = createReducerHandlers<Switcher>({
  SWITCH: ({ state }) => ({
    state: state.state === 'FOO' ? 'BAR' : 'FOO',
  }),
});

const reducer = createReducer<Switcher>({
  FOO: handlers,
  BAR: handlers,
});
```

### transition

TypeScript does not have exact generic return types, but this utility validates the transition.

```ts
import { createReducer, StatesReducer } from 'react-states';

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

type Switcher = StatesReducer<State, Action>;

const reducer = createReducer<Switcher>({
  FOO: {
    SWITCH: ({ transition }) =>
      transition({
        state: 'BAR',
      }),
  },
  BAR: {
    SWITCH: ({ transition }) =>
      transition({
        state: 'FOO',
      }),
  },
});
```

### noop

Explicit return of existing state, resulting in noop.

```ts
import { createReducer, StatesReducer } from 'react-states';

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

type Switcher = StatesReducer<State, Action>;

const reducer = createReducer<Switcher>({
  FOO: {
    SWITCH: ({ transition }) =>
      transition({
        state: 'BAR',
      }),
  },
  BAR: {
    SWITCH: ({ noop }) => noop(),
  },
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
