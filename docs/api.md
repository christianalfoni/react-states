# API

## Transition

```ts
import { transition } from 'react-states';

type State =
  | {
      state: 'NOT_LOADED';
    }
  | {
      state: 'LOADING';
    }
  | {
      state: 'LOADED';
      data: string[];
    }
  | {
      state: 'ERROR';
      error: string;
    };

type Action =
  | {
      type: 'LOAD';
    }
  | {
      type: 'LOAD_SUCCESS';
      data: string[];
    }
  | {
      type: 'LOAD_ERROR';
      error: string;
    };

const reducer = (prevState: State, action: Action) =>
  transition(prevState, action, {
    NOT_LOADED: {
      LOAD: () => ({
        state: 'LOADING',
      }),
    },
    LOADING: {
      LOAD_SUCCESS: (_, { data }) => ({
        state: 'LOADED',
        data,
      }),
      LOAD_ERROR: (_, { error }) => ({
        state: 'ERROR',
        error,
      }),
    },
    LOADED: {},
    ERRORL: {},
  });
```

### Utilities

#### match

```tsx
import { match } from 'react-states';
import { useData } from './useData';

const DataComponent = () => {
  const [state, dispatch] = useData();

  return match(state, {
    NOT_LOADED: () => <button onClick={() => dispatch({ type: 'LOAD' })}>Load data</button>,
    LOADING: () => 'Loading...',
    LOADED: ({ data }) => (
      <ul>
        {data.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    ),
    ERROR: ({ error }) => <span style={{ color: 'red' }}>{error}</span>,
  });
};
```

You can also do a partial match:

```ts
const data = match(
  state,
  {
    LOADED: ({ data }) => data,
  },
  (otherStates) => [],
);
```

#### matchProp

```tsx
import { matchProp } from 'react-states';
import { useData } from './useData';

const DataComponent = () => {
  const [state, dispatch] = useData();

  const data = matchProp(state, 'data')?.data ?? [];

  return (
    <ul>
      {data.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
};
```

#### useStateTransition

```ts
useEnterState(
  state,
  'FOO', // ['FOO', 'BAR']
  (current) => {
    // When entering either state(s), also initial state

    return () => {
      // When leaving to other state
    };
  },
);
```

```ts
// Inferred actual possible transitions
useTransitionState(
  state,
  {
    FOO: {
      SWITCH: 'BAR', // ['BAR', 'BAZ']
    },
  },
  (current, action, prev) => {
    // When either transition occurs

    return () => {
      // When other transition occurs
    };
  },
);
```

```ts
useTransitionState(state, (current, action?, prev?) => {
  // Any transition
});
```

### Utility Types

#### PickState

```ts
type ABState = PickState<State, 'A' | 'B'>;
```

#### PickAction

```ts
type ABAction = PickAction<Action, 'A' | 'B'>;
```

### Devtools

#### DevtoolsProvider

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

#### useDevtools

```tsx
import { useReducer } from 'react';
import { useDevtools } from 'react-states/devtools';

export const SomeComponent: React.FC = () => {
  const dataReducer = useData();

  useDevtools('Data', dataReducer);

  const [state, dispatch] = dataReducer;

  return <div />;
};
```
