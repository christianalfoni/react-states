# react-states

> Explicit states for predictable user experiences

Learn more about [CodeSandbox](https://codesandbox.io) and how we use react-states to enable our architecture on: [react-states.csb.dev](https://react-states.csb.dev).

## Install

```sh
npm install react-states@next
```

## API

### createEnvironment

Creates a provider which allows you to expose an environment API.

```tsx
type SomeApi = {};

type Environment = {
  someApi: SomeApi;
};

const { EnvironmentProvider, useEnvironment } = createEnvironment<Environment>();

const environment: Environment = {
  someApi: {},
};

const SomeComponent = () => {
  return (
    <EnvironmentProvider environment={environment}>
      <App />
    </EnvironmentProvider>
  );
};
```

### createReducer

Creates a reducer handling actions using explicit states. Each handler returns a transition. Either a new/existing state or a tuple of new/existing state and a command.

```ts
import { createReducer, States, StatesTransition } from 'react-states';
// Define state with an explicit state property
type State =
  | {
      state: 'SOME_STATE';
    }
  | {
      state: 'SOME_OTHER_STATE';
    };

// Define actions with a type property
type Action =
  | {
      type: 'SOME_ACTION';
    }
  | {
      type: 'SOME_OTHER_ACTION';
    };

// Optionally type commands
type Command = {
  cmd: 'SOME_COMMAND';
};

// Create a type for the feature, where the Command
// is optional
type SomeFeature = States<State, Action, Command>;

// Create an exact return type for the action
// handlers
type Transition = StatesTransition<SomeFeature>;

const reducer = createReducer<SomeFeature>({
  SOME_STATE: {
    SOME_ACTION: (currentState, action) => ({
      state: 'SOME_OTHER_STATE',
    }),
  },
  SOME_OTHER_STATE: {
    SOME_OTHER_ACTION: (currentState, action) => [
      {
        state: 'SOME_STATE',
      },
      {
        cmd: 'SOME_COMMAND',
      },
    ],
  },
});
```

### createSubscription

Creates a subscription, typically for an environment API.

```ts
type SomeEnvironmentAPIAction = {
  type: 'SOME_ENVIRONMENT_API:EVENT';
};

type SomeEnvironmentAPI = {
  subscription: Subscription<SomeEnvironmentAction>;
};

const someEnvironmentAPI: SomeEnvironmentAPI = {
  subscription: createSubscription(),
};

someEnvironmentAPI.subscription.emit({
  type: 'SOME_ENVIRONMENT_API:EVENT',
});
```

### useSubscription

Consume a subscription, typically from an environment API.

```ts
const SomeComponent = () => {
  const { someApi } = useEnvironment();
  const [state, dispatch] = useReducer(reducer, {
    state: 'SOME_STATE',
  });

  useSubscription(someApi.subscription, dispatch);

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

## Helper types

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
