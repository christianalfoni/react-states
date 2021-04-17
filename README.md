# react-states

> Explicit states for predictable user experiences

[![react-states](https://img.youtube.com/vi/ul_3ABrpj64/0.jpg)](https://youtu.be/ul_3ABrpj64)

**Take a look at a reference project using react-states**: [excalidraw-firebase](https://github.com/codesandbox/excalidraw-firebase).

---

**VERSION 4** has some breaking changes:

- Removed **useStates** hook, as new patterns made it obvious that the core helpers should be used instead
- **transition** is now **transitions** and it returns a reducer
- **map** is now **match** with improved typing
- No need to add **DevtoolManager** anymore
- There is a new **renderReducerHook** test helper

---

- [react-states](#react-states)
  - [Problem statement](#problem-statement)
  - [Solution](#solution)
  - [Devtools](#devtools)
  - [As context provider](#as-context-provider)
- [Patterns](#patterns)
  - [Lift actions](#lift-actions)
  - [Match all the things](#match-all-the-things)
  - [Subtype context for match](#subtype-context-for-match)
  - [Base contexts](#base-contexts)
  - [Nested contexts](#nested-contexts)
  - [Controlling effects](#controlling-effects)
- [API](#api)
  - [transitions](#transitions)
  - [exec](#exec)
  - [match](#match)
  - [matches](#matches)
  - [result](#result)
  - [renderReducerHook](#renderreducerhook)
  - [PickState and PickAction](#pickstate-and-pickaction)
- [Inspirations](#inspirations)

Your application logic is constantly bombarded by events. Some events are related to user interaction, others from the browser. Also any asynchronous code results in resolvement or rejection, which are also events. We typically write our application logic in such a way that our state changes and side effects are run as a direct result of these events. This approach can create unpredictable user experiences. The reason is that users treats our applications like Mr and Ms Potato Head, bad internet connections causes latency and the share complexity of a user flow grows out of hand and out of mind for all of us. Our code does not always run the way we intended it to.

**react-states** is at its core **3** utility functions made up of **20** lines of code that will make your user experience more predictable in React.

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
    .then((response) => {
      dispatch({ type: 'FETCH_TODOS_SUCCESS', data: response.data });
    })
    .catch((error) => {
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
        {todos.map((todo) => (
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

If you want to look at a real project using this approach, please visit: [excalidraw-firebase](https://github.com/codesandbox/excalidraw-firebase).

```tsx
import { transitions, exec, match } from 'react-states';

type Context =
  | {
      state: 'LOADING';
    }
  | {
      state: 'LOADED';
      data: [];
    }
  | {
      state: 'ERROR';
      error: string;
    };

type Action =
  | {
      type: 'FETCH_TODOS';
    }
  | {
      type: 'FETCH_TODOS_SUCCESS';
      data: Todo[];
    }
  | {
      type: 'FETCH_TODOS_ERROR';
      error: string;
    };

const todosReducer = transitions<Context, Action>({
  NOT_LOADED: {
    FETCH_TODOS: (): Context => ({ state: 'LOADING' }),
  },
  LOADING: {
    FETCH_TODOS_SUCCESS: ({ data }): Context => ({ state: 'LOADED', data }),
    FETCH_TODOS_ERROR: ({ error }): Context => ({ state: 'ERROR', error }),
  },
  LOADED: {},
  ERROR: {},
});

const Todos = () => {
  const [todos, dispatch] = useReducer(todosReducer, { state: 'NOT_LOADED' });

  useEffect(
    () =>
      exec(todos, {
        LOADING: () => {
          axios
            .get('/todos')
            .then((response) => {
              dispatch({ type: 'FETCH_TODOS_SUCCESS', data: response.data });
            })
            .catch((error) => {
              dispatch({ type: 'FETCH_TODOS_ERROR', error: error.message });
            });
        },
      }),
    [todos],
  );

  return (
    <div className="wrapper">
      {match(todos, {
        NOT_LOADED: () => 'Not loaded',
        LOADING: () => 'Loading...',
        LOADED: ({ data }) => (
          <ul>
            {data.map((todo) => (
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
- We are taking full advantage of [TypeScript](https://www.typescriptlang.org/), which helps us keep our state and UI in sync

**The solution here is not specifically related to controlling data fetching. It is putting you into the mindset of explicit states and guarding the state changes and execution of side effects. It applies to everything in your application, especially async code**

## Devtools

By adding the `DevtoolsProvider` to your React application you will get insight into the history of state changes, dispatches, side effects and also look at the definition of your `transitions` right from within your app.

```tsx
import * as React from 'react';
import { render } from 'react-dom';
import { DevtoolsProvider } from 'react-states/devtools';
import { App } from './App';

const rootElement = document.getElementById('root');

render(
  <DevtoolsProvider>
    <App />
  </DevtoolsProvider>,
  rootElement,
);
```

```tsx
import { transitions, useDevtools } from 'react-states/devtools';

const reducer = transitions({});

const SomeComponent = () => {
  const someReducer = useReducer(reducer);

  useDevtools('my-thing', someReducer);
};
```

## As context provider

Since there is no need for callbacks we have an opportunity to expose features as context providers which are strictly driven by dispatches and explicit states to drive side effects.

```tsx
const context = createContext(null);

type Context =
  | {
      state: 'UNAUTHENTICATED';
    }
  | {
      state: 'AUTHENTICATING';
    }
  | {
      state: 'AUTHNETICATED';
      user: { username: string };
    }
  | {
      state: 'ERROR';
      error: string;
    };

type Action =
  | {
      type: 'SIGN_IN';
    }
  | {
      type: 'SIGN_IN_SUCCESS';
      user: { username: string };
    }
  | {
      type: 'SIGN_IN_ERROR';
      error: string;
    };

export const useAuth = () => useContext(context);

const authReducer = transitions<Context, Action>({
  UNAUTHENTICATED: {
    SIGN_IN: (): Context => ({ state: 'AUTHENTICATING' }),
  },
  AUTHENTICATING: {
    SIGN_IN_SUCCESS: ({ user }): Context => ({ state: 'AUTHENTICATED', user }),
    SIGN_IN_ERROR: ({ error }): Context => ({ state: 'ERROR', error }),
  },
  AUTHENTICATED: {},
  ERROR: {},
});

export const AuthProvider = ({ children }) => {
  const value = useReducer(authReducer, {
    state: 'UNAUTHENTICATED',
  });

  const [auth, dispatch] = value;

  useEffect(
    () =>
      exec(auth, {
        AUTHENTICATING: () => {
          axios
            .get('/signin')
            .then((response) => {
              dispatch({ type: 'SIGN_IN_SUCCESS', user: response.data });
            })
            .catch((error) => {
              dispatch({ type: 'SIGN_IN_ERROR', error: error.message });
            });
        },
      }),
    [auth],
  );

  return <context.Provider value={value}>{children}</context.Provider>;
};
```

# Patterns

## Lift actions

Sometimes you might have one or multiple handlers across states. You can lift them up and compose them back into your transitions.

```ts
import { PickAction, transitions } from 'react-states';

const globalActions = {
  CHANGE_DESCRIPTION: ({ description }: PickAction<Action, 'CHANGE_DESCRIPTION'>, context: Context): Context => ({
    ...context,
    description,
  }),
};

const reducer = transitions<Action, Context>({
  FOO: {
    ...globalActions,
  },
  BAR: {
    ...globalActions,
  },
});
```

## Match all the things

You can use `match` for more than rendering a specific UI. You can for example use it for styling:

```tsx
<div
  css={match(someContext, {
    STATE_A: () => ({ opacity: 1 }),
    STATE_B: () => ({ opacity: 0.5 }),
  })}
/>
```

You can even create your own UI metadata related to a state which can be consumed throughout your UI definition:

```ts
const ui = match(someContext, {
  STATE_A: () => ({ icon: <IconA />, text: 'foo', buttonStyle: { color: 'red' } }),
  STATE_B: () => ({ icon: <IconB />, text: 'bar', buttonStyle: { color: 'blue' } }),
});

ui.icon;
ui.text;
ui.buttonStyle;
```

## Subtype context for match

You might have functions that only deals with certain states.

```ts
import { match, PickState } from 'react-states';

function mapSomeState(context: PickState<Context, 'A' | 'B'>) {
  return match(context, {
    A: () => {},
    B: () => {},
  });
}
```

`match` will infer the type of context and ensure type safety for the subtype.

## Base contexts

Sometimes you have multiple states sharing the same base context. You can best express this by:

```ts
type BaseContext = {
  ids: string[];
};

type Context =
  | {
      state: 'NOT_LOADED';
    }
  | {
      state: 'LOADING';
    }
  | (BaseContext &
      (
        | {
            state: 'LOADED';
          }
        | {
            state: 'LOADED_DIRTY';
          }
        | {
            state: 'LOADED_ACTIVE';
          }
      ));
```

This expresses the simplest states first, then indents the states using the base context. This ensures that you see these states related to their base and with their indentation they have "special meaning".

## Nested contexts

You do not have to express the whole context at the root, you can split it up into nested contexts.

```ts
type ValidationContext =
  | {
      state: 'VALID';
    }
  | {
      state: 'INVALID';
    }
  | {
      state: 'PENDING';
    };

type Context =
  | {
      state: 'ACTIVE';
      value: string;
      validation: ValidationContext;
    }
  | {
      state: 'DISABLED';
    };
```

Now any use of `exec` or `match` can be done on the sub contexts as well.

```ts
exec(context, {
  ACTIVE: ({ validation }) =>
    exec(validation, {
      PENDING: () => {},
    }),
});

match(context, {
  DISABLED: () => ({}),
  ACTIVE: ({ validation, focus }) =>
    match(validation, {
      VALID: () => ({}),
      INVALID: () => ({}),
      PENDING: () => ({}),
    }),
});
```

## Controlling effects

You can control effects in four ways.

```ts
// 1. The FOO effect runs every time
// it enters the FOO state, and
// disposes entering any new state, including
// entering FOO again
useEffect(
  () =>
    exec(context, {
      FOO: () => {},
    }),
  [context],
);

// 2. The FOO effect runs every time
// it enters the FOO state, and
// disposes only when moving out of the
// FOO state
useEffect(
  () =>
    exec(context, {
      FOO: () => {},
      BAR: () => {},
    }),
  [context.state],
);

// 3. The FOO effect runs every time
// it enters the FOO state, and
// disposes when moving to BAZ state, or
// unmounts
const shouldSubscribe = match(context, {
  FOO: () => true,
  BAR: () => true,
  BAZ: () => false,
});
useEffect(
  () =>
    shouldSubscribe &&
    exec(context, {
      FOO: () => {},
    }),
  [shouldSubscribe],
);
```

# API

## transitions

Creates an explicit and guarded reducer.

```ts
type Context =
  | {
      state: 'FOO';
    }
  | {
      state: 'BAR';
    };

type Action = {
  type: 'SWITCH';
};

const reducer = transitions<Context, Action>({
  FOO: {
    // Currently you should explicitly set the return type of the
    // handlers to the context, this will be resolved when
    // TypeScript gets Exact types: https://github.com/Microsoft/TypeScript/issues/12936
    SWITCH: (action, currentContext): Context => ({ state: 'BAR' }),
  },
  BAR: {
    SWITCH: (action, currentContext): Context => ({ state: 'FOO' }),
  },
});

useReducer(reducer);
```

The state argument is called **context** as it represents multiple states. The **context** should have a **state** property.

```ts
{
    state: 'SOME_STATE',
    otherValue: {}
}
```

`transitions` expects that your reducer actions has a **type** property:

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
    exec(someContext, {
      SOME_STATE: (currentContext) => {},
    }),
  [someContext],
);
```

The effects works like normal React effects, meaning you can return a function which will execute when the state changes:

```ts
useEffect(
  () =>
    exec(someContext, {
      TIMER_RUNNING: () => {
        const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);

        return () => clearInterval(id);
      },
    }),
  [someContext],
);
```

The **exec** is not exhaustive, meaning that you only add the states necessary.

## match

```tsx
const result = match(context, {
  SOME_STATE: (currentContext) => 'foo',
});
```

Is especially useful with rendering:

```tsx
return (
  <div className="wrapper">
    {match(todos, {
      NOT_LOADED: () => 'Not loaded',
      LOADING: () => 'Loading...',
      LOADED: ({ data }) => (
        <ul>
          {data.map((todo) => (
            <li>{todo.title}</li>
          ))}
        </ul>
      ),
      ERROR: ({ error }) => error.message,
    })}
  </div>
);
```

The **match** is exhaustive, meaning you have to add all states. This ensures predictability in the UI.

## matches

You can check if the result of **useReducer** matches a specific state. This is useful when creating hooks for your context providers.

```ts
export const useAuth = <T extends Context['state']>(state?: T) => {
  const reducer = useContext(context);
  if (matches(reducer, state)) {
    return reducer;
  }

  throw new Error('Not valid use of hook');
};
```

Now you can consume your reducer in specific states.

```tsx
const SomeComponent = () => {
  // Typed to AUTHENTICATED
  const [auth] = useAuth('AUTHENTICATED');
};
```

## result

Safe async resolvement. The API looks much like the Promise API, though it has cancellation and strong typing built in. This is inspired by the [Rust](https://www.rust-lang.org/) language.

```ts
import { result } from 'react-states';

const res = result<{}, { type: 'ERROR'; data: string }>((ok, err) =>
  // You return a promise from a result, this promise
  // should never throw, but rather return an "ok" or "err"
  doSomethingAsync()
    .then((data) => {
      return ok(data);
    })
    .catch((error) => {
      return err('ERROR', error.message);
    }),
);

const cancel = res.resolve((data) => {}, {
  ERROR: (data) => {},
});

// Cancels the resolver
cancel();
```

You can return a result resolver from the resolve callback. Any cancellation from the top cascades down to the currently running resolver.

## renderReducerHook

This is a test helper, which allows you to effectively test any reducers exposed through a context provider. It does this by keeping the same object reference for the **context** and rather updates that (mutates) whenever the reducer updates. This way you can reference the context multiple times, even though it changes.

```tsx
import { renderReducerHook } from 'react-states/test';

test('should go to FOO when switching', () => {
  const [context, dispatch] = renderReducerHook(
    () => useSomeContextProviderExposingAReducer(),
    (HookComponent) => (
      <ContextProviderExposingReducer>
        <HookComponent />
      </ContextProviderExposingReducer>
    ),
  );

  expect(context).toEqual<Context>({
    state: 'FOO',
  });

  act(() => {
    dispatch({ type: 'SWITCH' });
  });

  expect(context).toEqual<Context>({
    state: 'BAR',
  });
});
```

## PickState and PickAction

`react-states` exposes the `PickState` and `PickAction` helper types. Use these helper types when you "lift" your action handlers into separate functions.

```ts
type Context =
  | {
      state: 'FOO';
    }
  | {
      state: 'BAR';
    };

type Action =
  | {
      type: 'A';
    }
  | {
      type: 'B';
    };

const actions = {
  A: (action: PickAction<Action, 'A'>, context: PickState<Context, 'FOO'>) => {},
  B: (action: PickAction<Action, 'B'>, context: PickState<Context, 'FOO'>) => {},
};

const reducer = transitions<Context, Action>({
  FOO: {
    ...actions,
  },
  BAR: {},
});
```

# Inspirations

Me learning state machines and state charts is heavily influenced by @davidkpiano and his [XState](https://xstate.js.org/) library. So why not just use that? Well, XState is framework agnostic and needs more concepts like storing the state, sending events and subscriptions. These are concepts React already provides with reducer state, dispatches and the following reconciliation. Funny thing is that **react-states** is actually technically framework agnostic, but its API is designed to be used with React.
