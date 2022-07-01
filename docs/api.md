# API

## createStates

```ts
import { value createStates, value CreateUnion } from 'react-states';

const states = createStates({
  NOT_LOADED: () => ({}),
  LOADING: () => ({}),
  LOADED: (data: string[]) => ({ data }),
  ERROR: (error: string) => ({ error }),
});

type State = CreateUnion<typeof states>;

// Consume
states.LOADING();
```

## createActions

```ts
import { value createActions, value CreateUnion } from 'react-states';

const actions = createActions({
  LOAD: () => ({}),
  LOAD_SUCCESS: (data: string[]) => ({ data }),
  LOAD_ERROR: (error: string) => ({ error }),
});

type Action = CreateUnion<typeof actions>;

// Consume
const [state, dispatch] = useReducer(reducer);
const { LOAD, LOAD_SUCCESS, LOAD_ERROR } = actions(dispatch);
```

## Transition

```ts
import { value createStates, value createActions, value transition, value CreateUnion } from 'react-states';

const states = createStates({
  NOT_LOADED: () => ({}),
  LOADING: () => ({}),
  LOADED: (data: string[]) => ({ data }),
  ERROR: (error: string) => ({ error }),
});

type State = CreateUnion<typeof states>;

const actions = createActions({
  LOAD: () => ({}),
  LOAD_SUCCESS: (data: string[]) => ({ data }),
  LOAD_ERROR: (error: string) => ({ error }),
});

type Action = CreateUnion<typeof actions>;

const reducer = (prevState: State, action: Action) =>
  transition(prevState, action, {
    NOT_LOADED: {
      LOAD: () => states.LOADING(),
    },
    LOADING: {
      LOAD_SUCCESS: (_, { data }) => states.LOADED(data),
      LOAD_ERROR: (_, { error }) => states.ERROR(error),
    },
    LOADED: {},
    ERRORL: {},
  });
```

### Utilities

#### match

```tsx
import { value match } from 'react-states';
import { value useData } from './useData';

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
import { value matchProp } from 'react-states';
import { value useData } from './useData';

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
import { value act } from '@testing-library/react';
import { value renderReducer } from 'react-states/test';
import { value createEnvironment } from './environments/test';

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

#### PickState

```ts
type ABState = PickState<State, 'A' | 'B'>;
```

#### PickAction

```ts
type ABAction = PickAction<Action, 'A' | 'B'>;
```

#### CreateUnion

```ts
type State = CreateUnion<typeof states>;
type Action = CreateUnion<typeof actions>;
```

### Devtools

#### DevtoolsProvider

```tsx
import { value DevtoolsProvider } from 'react-states/devtools';

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
import { value useReducer } from 'react';
import { value useDevtools } from 'react-states/devtools';

export const SomeComponent: React.FC = () => {
  const dataReducer = useData();

  useDevtools('Data', dataReducer);

  const [state, dispatch] = dataReducer;

  return <div />;
};
```
