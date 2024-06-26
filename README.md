# react-states

> Explicit states for predictable user experiences

## Install

```sh
npm install react-states
```

## Description

This video is the initial introduction of the concept:

[![react-states concept](https://img.youtube.com/vi/ul_3ABrpj64/0.jpg)](https://www.youtube.com/watch?v=ul_3ABrpj64)

After exploring this concept at [CodeSandbox.io](https://codesandbox.io) we discovered one flaw in the concept. Using transition effects led to a lot of indirection in the code, which made it very difficult to reason about application flows. The indirection happens because your logic is split between the reducer, which is often a single file, and the component handling the effects of those transitions.

To fix this issue **react-states** is now co locating state with effects. That means your reducer does not only describe the transitions from one state to another, but can also describe an `effect` to execute as part of that transition.

You can now define your state, transitions and effects as a pure reducer hook. The actual execution of the effects is implemented with the usage of the hook. This is great for separation of concerns and testability.

## API

### createTransitionsHook

```tsx
import { createTransitionsHook } from "react-states";

type State =
  | {
      status: "NOT_LOADED";
    }
  | {
      status: "LOADING";
    }
  | {
      status: "LOADED";
      data: string;
    }
  | {
      status: "ERROR";
    };

type Action = {
  type: "FETCH";
};

type Effect = {
  type: "FETCH_DATA";
};

const useData = createTransitionsHook<State, Action, Effect>((transition) => ({
  NOT_LOADED: {
    FETCH: () =>
      transition(
        {
          status: "LOADING",
        },
        {
          type: "FETCH_DATA",
        }
      ),
  },
  LOADING: {
    FETCH_SUCCESS: ({ data }) =>
      transition({
        status: "LOADED",
        data,
      }),
    FETCH_ERROR: ({ error }) =>
      transition({
        status: "ERROR",
        error,
      }),
  },
  LOADED: {},
  ERROR: {},
}));

const DataComponent = () => {
  const [state, dispatch] = useData(
    {
      FETCH_DATA: async () => {
        const newData = await Promise.resolve("Some data");

        dispatch({
          type: "FETCH_SUCCESS",
          data: newData,
        });
      },
    },
    {
      status: "NOT_LOADED",
    }
  );

  return <div />;
};
```

The `transition` function is used to ensure type safety. It is not strictly necessary, but TypeScript does not have exact return types. That means you only get errors on lacking properties. The `transition` function ensures exact types on your state and effects.

### match

Transform state into values and UI.

#### Exhaustive match

```tsx
import { match } from "react-states";
import { useData } from "./useData";

const DataComponent = () => {
  const [state, dispatch] = useData(
    {
      FETCH_DATA: async () => {
        const newData = await Promise.resolve("Some data");

        dispatch({
          type: "FETCH_SUCCESS",
          data: newData,
        });
      },
    },
    {
      status: "NOT_LOADED",
    }
  );

  return match(state, {
    NOT_LOADED: () => (
      <button onClick={() => dispatch({ type: "LOAD" })}>Load data</button>
    ),
    LOADING: () => "Loading...",
    LOADED: ({ data }) => <div>Data: {data}</div>,
    ERROR: ({ error }) => <div style={{ color: "red" }}>{error}</div>,
  });
};
```

#### Partial match

```tsx
import { match } from "react-states";
import { useData } from "./useData";

const DataComponent = () => {
  const [state, dispatch] = useData(
    {
      FETCH_DATA: async () => {
        const newData = await Promise.resolve("Some data");

        dispatch({
          type: "FETCH_SUCCESS",
          data: newData,
        });
      },
    },
    {
      status: "NOT_LOADED",
    }
  );

  const dataWithDefault = match(
    state,
    {
      LOADED: ({ data }) => data,
    },
    (otherStates) => "No data yet"
  );

  return <div>Data: {dataWithDefault}</div>;
};
```

#### Match by key

```tsx
import { match } from "react-states";
import { useData } from "./useData";

const DataComponent = () => {
  const [state, dispatch] = useData(
    {
      FETCH_DATA: async () => {
        const newData = await Promise.resolve("Some data");

        dispatch({
          type: "FETCH_SUCCESS",
          data: newData,
        });
      },
    },
    {
      status: "NOT_LOADED",
    }
  );

  const dataWithDefault = match(state, "data")?.data ?? "No data yet";

  return <div>Data: {dataWithDefault}</div>;
};
```

### Debugging

```ts
import { debugging } from "react-states";

debugging.active = Boolean(import.meta.DEV);
```

You could also implement custom behaviour like a keyboard shortcut, localStorage etc.
