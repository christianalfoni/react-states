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
- [PickState](#pickstate)
- [PickAction](#pickaction)
- [PickStateCommand](#pickstatecommand)

Devtools

- [DevtoolsProvider](#devtoolsprovider)
- [useDevtools](#usedevtools)

## Core

### transition

Transition state and action in a reducer

```ts
import { transition, TTransitions } from 'react-states';

type Action = {
  type: 'SWITCH';
};

const FOO = () => ({
  state: 'FOO' as const,
});

const BAR = () => ({
  state: 'BAR' as const,
});

type State = ReturnType<typeof FOO | typeof BAR>;

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

### matchProp

```ts
const SomeComponent = () => {
  const [state, dispatch] = useReducer(reducer, {
    state: 'SOME_STATE',
  });

  return matchProp(state, 'someProp')?.someProp ?? 'Not there';
};
```

### useCommandEffect

Run an effect when the command is part of a transition.

```ts
import { transition, TTransitions } from 'react-states';

type Action = {
  type: 'SWITCH';
};

const $LOG = (message: string) => ({
  cmd: '$LOG' as const,
  message,
});

const FOO = () => ({
  state: 'FOO' as const,
  $LOG: $LOG('Moving into FOO'),
});

const BAR = () => ({
  state: 'BAR' as const,
  $LOG: $LOG('Moving into BAR'),
});

type State = ReturnType<typeof FOO | typeof BAR>;

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
  const [state, dispatch] = useReducer(reducer, initialState);

  useCommandEffect(state, '$LOG', ({ message }) => {
    console.log(message);
  });

  return null;
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
  const { someApi, emitter } = useEnvironment();
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE());

  // Dispatch environment actions into reducer
  useEffect(() => emitter.subscribe(dispatch));

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

### TTransitions

Types the object with all states and handlers

```ts
import { transition, TTransitions } from 'react-states';

type Action = {
  type: 'SWITCH';
};

const FOO = () => ({
  state: 'FOO' as const,
});

const BAR = () => ({
  state: 'BAR' as const,
});

type State = ReturnType<typeof FOO | typeof BAR>;

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

Types the object with a specific state and handlers

```ts
import { transition, TTransition } from 'react-states';

type Action = {
  type: 'SWITCH';
};

const FOO = () => ({
  state: 'FOO' as const,
});

const BAR = () => ({
  state: 'BAR' as const,
});

type State = ReturnType<typeof FOO | typeof BAR>;

const fooTransitions: TTransition<State, Action, 'FOO'> = {
  SWITCH: (state, action) => BAR(),
};
```

### TEmit

Type the emitter when creating environment .

```ts
import { TEmit } from 'react-states';

export type SomeApiEvent = {
  type: 'FOO';
};

export type SomeApi = {
  doThis(): void;
};

export const someApi = (emit: TEmit<SomeApiEvent>): SomeApi => ({
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
