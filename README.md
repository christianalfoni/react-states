# react-states

> Explicit states for predictable user experiences

Learn more about [CodeSandbox](https://codesandbox.io) and how we use react-states to enable our architecture on: [react-states.csb.dev](https://react-states.csb.dev).

## Install

```sh
npm install react-states@next
```

## Types

### State

State has an explicit **state** property describing the state.

```ts
type State =
  | {
      state: 'SOME_STATE';
    }
  | {
      state: 'SOME_OTHER_STATE';
    };
```

### Action

Action has a **type** property describing the type of action.

```ts
type Action =
  | {
      type: 'SOME_ACTION';
    }
  | {
      type: 'SOME_OTHER_ACTION';
    };
```

### Command

Command has a **cmd** property which names the command.

```ts
type Command =
  | {
      cmd: 'SOME_COMMAND';
    }
  | {
      cmd: 'SOME_OTHER_COMMAND';
    };
```

### Subscription

Subscriptions has a **type** property which describes the event.

```ts
type Subscription =
  | {
      type: 'SOME_EVENT';
    }
  | {
      type: 'SOME_OTHER_EVENT';
    };
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
const reducer = createReducer<State, Action, Command>({
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

### createReducerContext

Creates a correctly typed React context for the reducer.

```ts
const reducerContext = createReducerContext<State, Action, Command>();
```

### createSubscription

Creates a subscription, typically for an environment API.

```ts
type SomeEnvironmentAPIEvent = {
  type: 'SOME_ENVIRONMENT_API:EVENT';
};

type SomeEnvironmentAPI = {
  subscription: Subscription<SomeEnvironmentEvent>;
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
type NarrowedStates = PickState<SomeState, 'A' | 'B'>;
```

### PickAction

Narrows to specific actions.

```ts
type NarrowedActions = PickAction<SomeAction, 'A' | 'B'>;
```

### StateTransition

Exact return type for reducer handlers.

```ts
type Transition = StateTransition<State, Command>;
```
