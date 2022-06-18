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

const reducer = (state: State, action: Action) =>
  transition(state, action, {
    NOT_LOADED: {
      LOAD: () => ({ state: 'LOADING' }),
    },
    LOADING: {
      LOAD_SUCCESS: (_, { data }) => ({ state: 'LOADED', data }),
      LOAD_ERROR: (_, { error }) => ({ state: 'ERROR', error }),
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

  const partialMatch = match(
    state,
    {
      LOADED: ({ data }) => data,
    },
    (otherStates) => [],
  );

  const exhaustiveMatch = match(state, {
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

  return <div />;
};
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

#### useEnter

```ts
useEnter(
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

#### useTransition

```ts
// Inferred actual possible transitions
useTransition(state, 'FOO => SWITCH => BAR', (current, action, prev) => {});
```

```ts
useTransition(state, (current, action, prev) => {
  // Any transition
});
```

#### renderReducer

```tsx
import { act } from '@testing-library/react';
import { renderReducer } from 'react-states/test';
import { createEnvironment } from './environments/test';

it('should do something', () => {
  const environment = createEnvironment();
  const [state, dispatch] = renderReducer(
    () => useData(),
    (UseData) => (
      <EnvironmentProvider environment={environment}>
        <UseData />
      </EnvironmentProvider>
    ),
  );

  act(() => {
    dispatch({ type: 'LOAD' });
  });

  expect(state.state).toBe('LOADING');
});
```

### Utility Types

#### TTransitions

```ts
import { transition, TTransitions } from 'react-states';

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

const transitions: TTransitions<State, Action> = {
  FOO: {
    SWITCH: (state, action) => ({
      state: 'BAR',
    }),
  },
  BAR: {
    SWITCH: (state, action) => ({
      state: 'FOO',
    }),
  },
};

const reducer = (state: State, action: Action) => transition(state, action, transitions);
```

#### TTransition

```ts
import { transition, TTransitions, TTransition } from 'react-states';

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

const fooTransitions: TTransition<State, Action, 'FOO'> = {
  SWITCH: (state, action) => ({
    state: 'FOO',
  }),
};

const transitions: TTransitions<State, Action> = {
  FOO: fooTransitions,
  BAR: {
    SWITCH: (state, action) => ({
      state: 'FOO',
    }),
  },
};

const reducer = (state: State, action: Action) => transition(state, action, transitions);

const transitions: TTransitions<State, Action> = {
  FOO: fooTransitions,
  BAR: {
    SWITCH: () => ({
      state: 'FOO',
    }),
  },
};
```

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
