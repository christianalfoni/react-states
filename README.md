# react-states

> Explicit states predictable user experiences

- [Problem statement](#problem-statement)
- [Solution](#solution)
- [Explicit and safe code by example](#explicit-and-safe-code-by-example)
- [As context provider](#as-context-provider)
- [API](#api)

Your application logic is constantly bombarded by events. Some events are related to user interaction, others from the browser. Any asynchronous code results in resolvement or rejection. We typically write our application logic in such a way that these events directly drives our state changes and side effects, causing new events to trigger. But this is not safe code. Users treat your application like Mr and Ms Potato Head, bad internet connections causes latency and errors and the share complexity of a user flow grows out of hand and out of mind.

**react-states** is **3** utility functions made up of **20** lines of code that will make your code explicit and safe.

## Problem statement

**A typical way to express state in React is:**

```ts
const [todos, dispatch] = React.useReducer(
  (todos, action) => {
    switch (action.type) {
      case 'FETCH_TODOS':
        return { ...todos, isLoading: true };
      case 'FETCH_TODOS_SUCCESS':
        return { ...todos, isLoading: false, data: action.data };
      case 'FETCH_TODOS_ERROR':
        return { ...todos, isLoading: false, error: action.error };
    }
  },
  {
    isLoading: false,
    data: [],
    error: null,
  },
);
```

This way of expressing state has issues:

- We are not being explicit about what states this reducer can be in: `NOT_LOADED`, `LOADING`, `LOADED` and `ERROR`
- There is one state not expressed at all, `NOT_LOADED`
- There is not internal understanding of state when an action is handled. It will be handled regardless
  of the current state of the reducer

**A typical way to express logic in React is:**

```ts
const fetchTodos = React.useCallback(() => {
  dispatch({ type: 'FETCH_TODOS' });
  axios
    .get('/todos')
    .then(response => {
      dispatch({ type: 'FETCH_TODOS_SUCCESS', data: response.data });
    })
    .catch(error => {
      dispatch({ type: 'FETCH_TODOS_ERROR', error: error.message });
    });
}, []);
```

This way of expressing logic has issues:

- The logic of `fetchTodos` will run regardless of the current state of the reducer
- You have to create callbacks that needs to be passed down as props

**A typical way to express dynamic rendering in React is:**

```tsx
const Todos = ({ todos }) => {
  let content = null;

  if (todos.error) {
    content = 'There was an error';
  } else if (todos.isLoading) {
    content = 'Loading...';
  } else {
    content = (
      <ul>
        {todos.map(todo => (
          <li>{todo.title}</li>
        ))}
      </ul>
    );
  }

  return <div className="wrapper">{content}</div>;
};
```

This way of expressing dynamic render has issues:

- It is not very appealing is it?
- Since the reducer has no explicit states, it can have an `error` and `isLoading` at the same time, it is not necessarily correct to render an `error` over the `isLoading` state

## Solution

```tsx
import { transition, exec, transform } from 'react-states';

const Todos = () => {
  const [todos, dispatch] = useReducer(
    (state, action) =>
      transition(state, action, {
        NOT_LOADED: {
          FETCH_TODOS: () => ({ state: 'LOADING' }),
        },
        LOADING: {
          FETCH_TODOS_SUCCESS: ({ data }) => ({ state: 'LOADED', data }),
          FETCH_TODOS_ERROR: ({ error }) => ({ state: 'ERROR', error }),
        },
        LOADED: {},
        ERROR: {},
      }),
    { state: 'NOT_LOADED' },
  );

  useEffect(
    () =>
      exec(todos, {
        LOADING: () => {
          axios
            .get('/todos')
            .then(response => {
              dispatch({ type: 'FETCH_TODOS_SUCCESS', data: response.data });
            })
            .catch(error => {
              dispatch({ type: 'FETCH_TODOS_ERROR', error: error.message });
            });
        },
      }),
    [todos],
  );

  return (
    <div className="wrapper">
      {transform(todos, {
        NOT_LOADED: () => 'Not loaded',
        LOADING: () => 'Loading...',
        LOADED: ({ data }) => (
          <ul>
            {data.map(todo => (
              <li>{todo.title}</li>
            ))}
          </ul>
        ),
        ERROR: ({ error }) => error.message,
      })}
    </div>
  );
};
```

## Explicit and safe code by example

### Authentication

With a traditional reducer you often guard it from the outside. For example:

```tsx
const Auth = () => {
  const [auth, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case 'SIGN_IN':
          return { ...state, isAuthenticating: true };
        case 'SIGN_IN_SUCCESS':
          return { ...state, isAuthenticating: false, user: action.user };
        case 'SIGN_IN_ERROR':
          return { ...state, isAuthenticating: false, error: action.error };
      }
    },
    {
      user: null,
      isAuthenticating: false,
      error: null,
    },
  );

  const signIn = useCallback(() => {
    dispatch({ type: 'SIGN_IN' });
    axios
      .get('/signin')
      .then(response => {
        dispatch({ type: 'SIGN_IN_SUCCESS', user: response.data });
      })
      .catch(error => {
        dispatch({ type: 'SIGN_IN_ERROR', error: error.message });
      });
  }, []);

  return (
    <button onClick={signIn} disabled={auth.isAuthenticating}>
      Log In
    </button>
  );
};
```

Calling `authenticate` twice is invalid behaviour, but this is not defined within your reducer. The only thing preventing your authentication logic from running multiple time, causing all sorts of weirdness, is an HTML attribute. This is fragile because you separate the logic. The **explicit and safe** way would be:

```tsx
const Auth = () => {
  const [auth, dispatch] = useReducer(
    (state, action) =>
      transition(state, action, {
        UNAUTHENTICATED: {
          SIGN_IN: () => ({ state: 'AUTHENTICATING' }),
        },
        AUTHENTICATING: {
          SIGN_IN_SUCCESS: ({ user }) => ({ state: 'AUTHENTICATED', user }),
          SIGN_IN_ERROR: ({ error }) => ({ state: 'ERROR', error }),
        },
        AUTHENTICATED: {},
        ERROR: {},
      }),
    {
      state: 'UNAUTHENTICATED',
    },
  );

  useEffect(
    () =>
      exec(auth, {
        AUTHENTICATING: () => {
          axios
            .get('/signin')
            .then(response => {
              dispatch({ type: 'SIGN_IN_SUCCESS', user: response.data });
            })
            .catch(error => {
              dispatch({ type: 'SIGN_IN_ERROR', error: error.message });
            });
        },
      }),
    [auth],
  );

  return (
    <button onClick={() => dispatch({ type: 'SIGN_IN' })} disabled={auth.state === 'AUTHENTICATING'}>
      Log In
    </button>
  );
};
```

Now the application can dispatch as many `SIGN_IN` as it wants, the reducer will only handle one at a time.

### Initial data

Typically you want to load some initial data in your application. This might be loaded behind a TAB in the UI, meaning you pass down a callback to trigger the fetching of data when the child TAB component mounts.

```tsx
const Tabs = () => {
  const [list, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case 'FETCH':
          return { ...state, isLoading: true };
        case 'FETCH_SUCCESS':
          return { ...state, isLoading: false, data: action.data };
        case 'FETCH_ERROR':
          return { ...state, isLoading: false, error: action.error };
      }
    },
    {
      data: null,
      isLoading: false,
      error: null,
    },
  );

  const fetchList = useCallback(() => {
    dispatch({ type: 'FETCH' });
    axios
      .get('/list')
      .then(response => {
        dispatch({ type: 'FETCH_SUCCESS', data: response.data });
      })
      .catch(error => {
        dispatch({ type: 'FETCH_ERROR', error: error.message });
      });
  }, []);

  return (
    <TabsComponent currentIndex={0} tabs={['List']}>
      <List list={list} fetchList={fetchList} />
    </TabsComponent>
  );
};
```

The issue we have created now is that the mounting of our `List` is what drives our logic. That means whenever the user would move away from this `List` tab and back, it would trigger a new fetch of the list. But this is typically not what you want. The fetching of the list could also be slow, where the user again moves back and forth. That means when they move back the list might be there, but then suddenly it is set again because of a late resolvement causing UI flicker or more critical issues.

By rather:

```tsx
const Tabs = () => {
  const list = useReducer(
    (state, action) =>
      transition(state, action, {
        NOT_LOADED: {
          FETCH: () => ({ state: 'LOADING' }),
        },
        LOADING: {
          FETCH_SUCCESS: ({ data }) => ({ state: 'LOADED', data }),
          FETCH_ERROR: ({ error }) => ({ state: 'LOADED', error }),
        },
        LOADED: {},
        ERROR: {},
      }),
    {
      state: 'NOT_LOADED',
    },
  );
  const [listState, listDispatch] = list;

  useEffect(() =>
    exec(listState, {
      LOADING: () => {
        axios
          .get('/list')
          .then(response => {
            listDispatch({ type: 'FETCH_SUCCESS', data: response.data });
          })
          .catch(error => {
            listDispatch({ type: 'FETCH_ERROR', error: error.message });
          });
      },
    }),
  );

  return (
    <TabsComponent currentIndex={0} tabs={['List']}>
      <List list={list} />
    </TabsComponent>
  );
};
```

Now it does not matter how many times the `List` component mounts. There will only be a single fetching of the list. If you wanted to fetch the list again when it was already loaded you could just do the following change:

```ts
const list = useReducer(
  (state, action) =>
    transition(state, action, {
      NOT_LOADED: {
        FETCH: () => ({ state: 'LOADING' }),
      },
      LOADING: {
        FETCH_SUCCESS: ({ data }) => ({ state: 'LOADED', data }),
        FETCH_ERROR: ({ error }) => ({ state: 'LOADED', error }),
      },
      LOADED: {
        // We allow fetching again when we have loaded the data
        FETCH: () => ({ state: 'LOADING' }),
      },
      ERROR: {},
    }),
  {
    state: 'NOT_LOADED',
  },
);
```

As you can see we are explicit about how events in the application are dealt with using explicit states. This results in safer code.

## As context provider

Since there is not need for callbacks we have an opportunity to expose features as context providers which are strictly driven by dispatches and explicit states to drive side effects.

```tsx
const context = createContext(null);

export const useAuth = () => useContext(context);

export const AuthProvider = ({ children }) => {
  const auth = useReducer(
    (state, action) =>
      transition(state, action, {
        UNAUTHENTICATED: {
          SIGN_IN: () => ({ state: 'AUTHENTICATING' }),
        },
        AUTHENTICATING: {
          SIGN_IN_SUCCESS: ({ user }) => ({ state: 'AUTHENTICATED', user }),
          SIGN_IN_ERROR: ({ error }) => ({ state: 'ERROR', error }),
        },
        AUTHENTICATED: {},
        ERROR: {},
      }),
    {
      state: 'UNAUTHENTICATED',
    },
  );
  const [authState, dispatch] = auth;

  useEffect(
    () =>
      exec(authState, {
        AUTHENTICATING: () => {
          axios
            .get('/signin')
            .then(response => {
              dispatch({ type: 'SIGN_IN_SUCCESS', user: response.data });
            })
            .catch(error => {
              dispatch({ type: 'SIGN_IN_ERROR', error: error.message });
            });
        },
      }),
    [authState],
  );

  return <context.Provider value={auth}>{children}</context.Provider>;
};
```

# API

## transition

```ts
useReducer((state, action) =>
  transition(state, action, {
    SOME_STATE: {
      SOME_ACTION_TYPE: (action, currentState) => ({ state: 'NEW_STATE' }),
    },
  }),
);
```

`transition` expects that your reducer state has a **state** property:

```ts
{
    state: 'SOME_STATE',
    otherValue: {}
}
```

`transition` expects that your reducer actions has a **type** property:

```ts
{
    type: 'SOME_EVENT',
    otherValue: {}
}
```

## exec

```ts
useEffect(
  () =>
    exec(someState, {
      SOME_STATE: currentState => {},
    }),
  [someState],
);
```

If your state triggers multiple effects you can give an array instead:

```ts
useEffect(
  () =>
    exec(someState, {
      SOME_STATE: [function effectA(currentState) {}, function effectB(currentState) {}],
    }),
  [someState],
);
```

The effects works like normal React effects, meaning you can return a function which will execute when the state changes:

```ts
useEffect(
  () =>
    exec(someState, {
      TIMER_RUNNING: () => {
        const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);

        return () => clearInterval(id);
      },
    }),
  [someState],
);
```

## transform

```tsx
const result = transform(state, {
  SOME_STATE: currentState => 'foo',
});
```

Is especially useful with rendering:

```tsx
return (
  <div className="wrapper">
    {transform(todos, {
      NOT_LOADED: () => 'Not loaded',
      LOADING: () => 'Loading...',
      LOADED: ({ data }) => (
        <ul>
          {data.map(todo => (
            <li>{todo.title}</li>
          ))}
        </ul>
      ),
      ERROR: ({ error }) => error.message,
    })}
  </div>
);
```
