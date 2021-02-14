# react-states

> Explicit states for predictable user experiences

- [Problem statement](#problem-statement)
- [Solution](#solution)
- [Predictable user experience by example](#predictable-user-experience-by-example)
- [As context provider](#as-context-provider)
- [API](#api)

Your application logic is constantly bombarded by events. Some events are related to user interaction, others from the browser. Also any asynchronous code results in resolvement or rejection, which are also events. We typically write our application logic in such a way that our state changes and side effects are run as a direct result of these events. This approach can create unpredictable user experiences. The reason is that users treats our applications like Mr and Ms Potato Head, bad internet connections causes latency and the share complexity of a user flow grows out of hand and out of mind for all of us. Our code does not always run the way we intended it to.

**react-states** is **3** utility functions made up of **20** lines of code that will make your user experience more predictable.

**NOTE!** This documentation is a good read if you have no intention of using the tools provided. It points to complexities that we rarely deal with in application development and is good to reflect upon :-)

## Problem statement

**A typical way to express state in React is:**

```ts
const [todos, dispatch] = React.useReducer(
  (state, action) => {
    switch (action.type) {
      case 'FETCH_TODOS':
        return { ...state, isLoading: true };
      case 'FETCH_TODOS_SUCCESS':
        return { ...state, isLoading: false, data: action.data };
      case 'FETCH_TODOS_ERROR':
        return { ...state, isLoading: false, error: action.error };
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
- There is no internal understanding of state when an action is handled. It will be handled regardless
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

- The logic of `fetchTodos` is at the mercy of whoever triggers it. There is no explicit state guarding that it should run or not
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

- Since the reducer has no explicit states, it can have an `error` and `isLoading` at the same time, it is not necessarily correct to render an `error` over the `isLoading` state
- It is not very appealing is it?

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

- The todos will only be loaded once, no matter how many times `FETCH_TODOS` is dispatched
- The logic for actually fetching the todos will also only run once, because it is an effect of
  moving into the `LOADING` state
- We only need `dispatch` now
- We are explicit about what state the reducer is in, meaning if we do want to enable fetching the todos several times we can allow it in the `LOADED` state, meaning you will at least not fetch the todos while they are already being fetched

**The solution here is not specifically related to controlling data fetching. It is putting you into the mindset of explicit states and guarding the state changes and execution of side effects. It applies to everything in your application, especially async code**

## Predictable user experience by example

### Authentication

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

Calling `authenticate` twice is invalid behaviour, but this is not defined within your reducer. The only thing preventing your authentication logic from running multiple time, causing all sorts of weirdness, is an HTML attribute. This is fragile because you separate the logic. With **explicit states** you could rather:

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

Now the application can dispatch as many `SIGN_IN` as it wants, the reducer will only handle a single one whenever the current state is `UNAUTHENTICATED`.Of course we still disable the button, but this is a property of the UI, it is not part of our application logic.

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

With **explicit states**:

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

But we would still never get into a situation when we are loading the list, that we start loading it again.

### Logic within same state

Imagine you want to add and remove items from the list, where any new items are **POST**ed to the server and any updates are **PATCH**ed to the server. We are going to deal with the real complexity of this:

- When you create an item it might fail
- When you update an item it might fail
- When changing an item being created, it needs to finish creating it before we send the update
- When updating an item being updated, it needs to finish updating it before we send the update
- When changing an item being created and the creation fails, we should not send the update
- When changing an item being updated and the update fails, we should not send the update

We will only care about the `LOADED` state in this example and we introduce the same explicit state to every item:

```tsx
const Items = () => {
  const [items, dispatch] = useReducer(
    (state, action) =>
      transition(state, action, {
        LOADED: {
          ADD_ITEM: ({ id, title }, { data }) => ({
            state: 'LOADED',
            data: { ...data, [id]: { id, title, state: 'QUEUED_CREATE' } },
          }),
          CHANGE_ITEM: ({ id, title }, { data }) => ({
            state: 'LOADED',
            data: {
              ...data,
              [id]: {
                id,
                title,
                state:
                  data[id].state === 'CREATING' || data[id].state === 'UPDATING'
                    ? 'QUEUED_DIRTY'
                    : data[id].state === 'CREATE_ERROR'
                    ? 'QUEUED_CREATE'
                    : 'QUEUED_UPDATE',
              },
            },
          }),
          CREATE_ITEM: ({ id }, { data }) => ({
            state: 'LOADED',
            data: { ...data, [id]: { ...data[id], state: 'CREATING' } },
          }),
          CREATE_ITEM_SUCCESS: ({ id }, { data }) => ({
            state: 'LOADED',
            data: {
              ...data,
              [id]: { ...data[id], state: data[id].state === 'QUEUED_DIRTY' ? 'QUEUED_UPDATE' : 'CREATED' },
            },
          }),
          CREATE_ITEM_ERROR: ({ id, error }, { data }) => ({
            state: 'LOADED',
            data: { ...data, [id]: { ...data[id], state: 'CREATE_ERROR', error } },
          }),
          UPDATE_ITEM: ({ id }, { data }) => ({
            state: 'LOADED',
            data: { ...data, [id]: { ...data[id], state: 'UPDATING' } },
          }),
          UPDATE_ITEM_SUCCESS: ({ id }, { data }) => ({
            state: 'LOADED',
            data: {
              ...data,
              [id]: { ...data[id], state: data[id].state === 'QUEUED_DIRTY' ? 'QUEUED_UPDATE' : 'UPDATED' },
            },
          }),
          UPDATE_ITEM_ERROR: ({ id, error }, { data }) => ({
            state: 'LOADED',
            data: { ...data, [id]: { ...data[id], state: 'UPDATE_ERROR', error } },
          }),
        },
      }),
    { state: 'NOT_LOADED' },
  );

  useEffect(() =>
    exec(items, {
      LOADING: [
        function createItem({ data }) {
          const queuedItem = Object.values(data).find(item => item.state === 'QUEUED_CREATE');

          if (queuedItem) {
            dispatch({ type: 'CREATE_ITEM', id: queuedItem.id });
            axios
              .post('/items', queuedItem)
              .then(response => {
                dispatch({ type: 'CREATE_ITEM_SUCCESS', data: response.data });
              })
              .catch(error => {
                dispatch({ type: 'CREATE_ITEM_ERROR', error: error.message });
              });
          }
        },
        function updateItem({ data }) {
          const queuedItem = Object.values(data).find(item => item.state === 'QUEUED_UPDATE');

          if (queuedItem) {
            dispatch({ type: 'UPDATE_ITEM', id: queuedItem.id });
            axios
              .patch('/items', queuedItem)
              .then(response => {
                dispatch({ type: 'UPDATE_ITEM_SUCCESS', data: response.data });
              })
              .catch(error => {
                dispatch({ type: 'UPDATE_ITEM_ERROR', error: error.message });
              });
          }
        },
      ],
    }),
  );
};
```

This example shows the real complexity of doing optimistic updates and keeping our request to the server in order, also dealing with any errors that can occur. Typically we do not deal with this at all, but with explicit states we are drawn into reasoning about and model this complexity.

The lifetime of an item can now be:

- `QUEUED_CREATE` -> `CREATED`
- `QUEUED_UPDATE` -> `UPDATED`
- `QUEUED_CREATE` -> `CREATE_ERROR`
- `QUEUED_UPDATE` -> `UPDATE_ERROR`
- `QUEUED_CREATE` -> It was changed -> `QUEUED_DIRTY` -> `QUEUED_UPDATE` -> `UPDATED`
- `QUEUED_UPDATE` -> It was changed -> `QUEUED_DIRTY` -> `QUEUED_UPDATE` -> `UPDATED`
- `QUEUED_CREATE` -> It was changed -> `QUEUED_DIRTY` -> `CREATE_ERROR`
- `QUEUED_UPDATE` -> It was changed -> `QUEUED_DIRTY` -> `UPDATE_ERROR`
- `QUEUED_CREATE` -> `CREATE_ERROR` -> It was changed -> `QUEUED_CREATE`

## As context provider

Since there is no need for callbacks we have an opportunity to expose features as context providers which are strictly driven by dispatches and explicit states to drive side effects.

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
