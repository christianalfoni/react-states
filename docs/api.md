# API

Factories
- [createEnvironment](#createEnvironment)
- [createReducer](#createReducer)
- [createSubscription](#createSubscription)

Effects
- [useStateEffect](#useStateEffect)
- [useSubscription](#useSubscription)
- [useCommandEffect](#useCommandEffect)

Utils
- [match](#match)

Type Utils
- [PickState](#PickState)
- [PickAction](#PickAction)
- [PickCommand](#PickCommand)
- [PickHandlers](#PickHandlers)

Devtools
- [DevtoolsProvider](#DevtoolProvider)
- [useDevtool](#useDevtool)

## Factories

### createEnvironment

```tsx
import { createEnvironment } from '@codesandbox/react-states'

export type Environment = {
  someApi: {},
  someOtherApi: {}
}

export const {
  EnvironmentProvider,
  useEnvironment
} = createEnvironment<Environment>();
```

### createReducer

```ts
import {
  createReducer,
  States,
  StatesTransition
} from "@codesandbox/react-states";

type State =
  | {
      state: "FOO";
    }
  | {
      state: "BAR";
    };

type Action = {
  type: "SWITCH";
}

type Command = {
  cmd: "LOG";
  message: string
};

// Command is optional
type Switcher = States<State, Action, Command>;

type Transition = StatesTransition<Switcher>;

const reducer = createReducer<Switcher>({
  FOO: {
    SWITCH: (currentState, action): Transition => ({
      state: "BAR",
    }),
  },
  BAR: {
    SWITCH: (currentState, action): Transition => [
      { state: "FOO", },
      { cmd: "LOG", message: 'Switched from BAR' },
    ],
  },
});
```

### createSubscription

```ts
import { createSubscription } from '@codesandbox/react-states'

type SubscriptionEvent = {
  type: "EVENT_A";
} | {
  type: 'EVENT_B'
}

const subscription = createSubscription<SubscriptionEvent>()

subscription.emit({
  type: "EVENT_A",
});
```

## Effects

### useStateEffect

Run an effect when entering a specific state.

```ts
const SomeComponent = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useStateEffect(state, "SOME_STATE", () => {
    // Run when entering state
    return () => {
      // Dispose when exiting the state
    };
  });

  useStateEffect(state, ["SOME_STATE", "SOME_OTHER_STATE"], () => {
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

  useCommandEffect(state, "SOME_COMMAND", () => {
    // Run when command is part of transition
  });

  return null;
};
```

### useSubscription

```tsx
import { useSubscription } from '@codesandbox/react-states'

const SomeComponent: React.FC = ({ subscription }) => {
  useSubscription(subscription, (event) => {
    
  });

  return null;
};
```

## Utils

### match

```ts
const SomeComponent = () => {
  const [state, dispatch] = useReducer(reducer, {
    state: "SOME_STATE",
  });

  return match(state, {
    SOME_STATE: () => "Hello",
    OTHER_STATE: () => "Ops",
  });
};
```



## Type Utils

### PickState

Narrows to specific states.

```ts
type NarrowedStates = PickState<SomeStatesType, "A" | "B">;
```

### PickAction

Narrows to specific actions.

```ts
type NarrowedActions = PickAction<SomeStatesType, "A" | "B">;
```

### PickCommand

Narrows to specific commands. **Note** it will return a `TState` shape of the commands,
not `TCommand`.

```ts
type NarrowedCommands = PickCommand<SomeStatesType, "C-A" | "C-B">;
```

### PickHandlers

Narrows to specific handlers.

```ts
type NarrowedHandlers = PickHandlers<SomeStatesType, "A">;
```