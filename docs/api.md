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

export const useData = () => useReducer(reducer, { state: 'NOT_LOADED' });
```

### Utilities

#### match

```tsx
import { match } from 'react-states';
import { useData } from './useData';

const DataComponent = () => {
  const [state, dispatch] = useData();

  return (
    <div>
      {match(state, {
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
      })}
    </div>
  );
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

#### useStateEffect

```tsx
import { useStateEffect } from 'react-states';
import { useData } from './useData';

const DataComponent = () => {
  const [state, dispatch] = useData();

  useStateEffect(state, 'NOT_LOADED', () => {
    fetch('/data')
      .then((response) => response.json())
      .then((data) =>
        dispatch({
          type: 'LOAD_SUCCESS',
          data,
        }),
      )
      .catch((error) =>
        dispatch({
          type: 'LOAD_ERROR',
          error: error.message,
        }),
      );
  });

  return <div />;
};
```

#### useCommandEffect

```tsx
import { transition, $COMMAND } from 'react-states';

type Command = {
  cmd: 'SAVE_DATA';
  data: string[];
};

type State =
  | {
      state: 'LOADING';
    }
  | {
      state: 'LOADED';
      [$COMMAND]?: Command;
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
    }
  | {
      type: 'ADD_ITEM';
    };

const reducer = (state: State, action: Action) =>
  transition(state, action, {
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
    LOADED: {
      ADD_ITEM: ({ data }, { item }) => {
        const data = [item].concat(data);

        return {
          state: 'LOADED',
          data,
          [$COMMAND]: {
            cmd: 'SAVE_DATA',
            data,
          },
        };
      },
    },
    ERROR: {},
  });

const DataComponent = () => {
  const [state, dispatch] = useReducer(reducer, { state: 'LOADING' });

  useCommandEffect(state, 'SAVE_DATA', ({ data }) => {
    localStorage.setItem('data', JSON.stringify(data));
  });

  return <div />;
};
```

#### defineEnvironment

```tsx
import { defineEnvironment } from 'react-states';

export type EnvironmentEvent =
  | {
      type: 'DATA:LOAD_SUCCESS';
      data: string;
    }
  | {
      type: 'DATA:LOAD_ERROR';
      error: string;
    };

export type Environment = {
  dataLoader: {
    load(): void;
  };
};

export const { createEnvironment, EnvironmentProvider, useEnvironment } = defineEnvironment<
  Environment,
  EnvironmentEvent
>();
```

##### createEnvironment

```ts
import { createEnvironment } from './environment-interface';

export const environment = createEnvironment((emit) => ({
  dataLoader: {
    load() {
      fetch('/data')
        .then((response) => response.json())
        .then((data) =>
          emit({
            type: 'DATA:LOAD_SUCCESS',
            data,
          }),
        )
        .catch((error) =>
          emit({
            type: 'DATA:LOAD_ERROR',
            error: error.message,
          }),
        );
    },
  },
}));
```

##### EnvironmentProvider

```tsx
import { EnvironmentProvider } from './environment-interface';
import { environment } from './environments/browser';

export const AppWrapper: React.FC = () => {
  return (
    <EnvironmentProvider environment={environment}>
      <App />
    </EnvironmentProvider>
  );
};
```

##### useEnvironment

```tsx
import { transition } from 'react-states';
import { useEnvironment, EnvironmentEvent } from '../environment-interface';

type State =
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

type Action = {
  type: 'LOAD';
};

const reducer = (state: State, action: Action | EnvironmentEvent) =>
  transition(state, action, {
    LOADING: {
      'DATA:LOAD_SUCCESS': (_, { data }) => ({ state: 'LOADED', data }),
      'DATA:LOAD_ERROR': (_, { error }) => ({ state: 'ERROR', error }),
    },
    LOADED: {},
    ERRORL: {},
  });

const DataComponent = () => {
  const { dataLoader, emitter } = useEnvironment();
  const [state, dispatch] = useData();

  useEffect(() => emitter.subscribe(dispatch));

  useStateEffect(state, 'LOADING', () => {
    dataLoader.load();
  });

  return <div />;
};
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

  expect(environment.dataLoader.load).toBeCalled();

  act(() => {
    environment.emitter.emit({
      type: 'DATA:LOAD_SUCCESS',
      items: ['foo', 'bar'],
    });
  });

  expect(state).toEqual({
    state: 'LOADED',
    items: ['foo', 'bar'],
  });
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
    SWITCH: (state, action) => BAR(),
  },
  BAR: {
    SWITCH: (state, action) => FOO(),
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
  SWITCH: (state, action) => BAR(),
};

const transitions: TTransitions<State, Action> = {
  FOO: fooTransitions,
  BAR: {
    SWITCH: (state, action) => FOO(),
  },
};

const reducer = (state: State, action: Action) => transition(state, action, transitions);

const transitions: TTransitions<State, Action> = {
  FOO: fooTransitions,
  BAR: {
    SWITCH: () => FOO(),
  },
};
```

#### TEmit

```ts
import { TEmit } from 'react-states';
import { SomeApi, SomeApiEvent } from '../environment-interface/someApi';

export const someApi = (emit: TEmit<SomeApiEvent>): SomeApi => ({
  doThis() {
    emit({ type: 'FOO' });
  },
});
```

#### ReturnTypes

```ts
import { ReturnTypes, IAction, IState, ICommand } from 'react-states';

const states = {
  FOO: () => ({
    state: 'FOO' as const,
  }),
  BAR: () => ({
    state: 'BAR' as const,
  }),
};

type State = ReturnTypes<typeof states, IState>;

const actions = {
  SWITCH: () => ({
    type: 'SWITCH' as const,
  }),
};

type Action = ReturnTypes<typeof actions, IAction>;

const commands = {
  LOG: () => ({
    cmd: 'LOG' as const,
  }),
};

type Command = ReturnTypes<typeof actions, ICommand>;
```

#### PickState

```ts
type ABState = PickState<State, 'A' | 'B'>;
```

#### PickAction

```ts
type ABAction = PickAction<Action, 'A' | 'B'>;
```

#### PickCommand

```ts
type ABCommand = PickCommand<Command, 'A' | 'B'>;
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
