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

To fix this issue **react-states** is now co locating state with commands. That means your reducer does not only describe the transitions from one state to another, but can also describe a `command` to execute as part of that transition.

You can now define your state, transitions and commands as a pure reducer hook. The actual execution of the commands is implemented with the usage of the hook. This is great for separation of concerns and testability.

## API

### createTransitions

```ts
import { createTransitions } from "react-states";

type State =
  | {
      state: "NOT_LOADED";
    }
  | {
      state: "LOADING";
    }
  | {
      state: "LOADED";
      data: string;
    }
  | {
      state: "ERROR";
    };

type Action = {
  type: "FETCH";
};

type Cmd = {
  cmd: "FETCH_DATA";
};

export const useData = createTransitions<State, Action, Cmd>({
  NOT_LOADED: {
    FETCH: () => [
      {
        state: "LOADING",
      },
      {
        cmd: "FETCH_DATA",
      },
    ],
  },
  LOADING: {
    FETCH_SUCCESS: ({ data }) => ({
      state: "LOADED",
      data,
    }),
    FETCH_ERROR: ({ error }) => ({
      state: "ERROR",
      error,
    }),
  },
  LOADED: {},
  ERROR: {},
});
```

### match

Transform state into values and UI.

#### Exhaustive match

```tsx
import { match } from "react-states";
import { useData } from "./useData";

const DataComponent = () => {
  const [data, dispatch] = useData({
    FETCH_DATA: async () => {
      const newData = await Promise.resolve("Some data");

      dispatch({
        type: "FETCH_SUCCESS",
        data: newData,
      });
    },
  });

  return match(data, {
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
  const [data, dispatch] = useData({
    FETCH_DATA: async () => {
      const newData = await Promise.resolve("Some data");

      dispatch({
        type: "FETCH_SUCCESS",
        data: newData,
      });
    },
  });

  const dataWithDefault = match(
    data,
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
  const [data, dispatch] = useData({
    FETCH_DATA: async () => {
      const newData = await Promise.resolve("Some data");

      dispatch({
        type: "FETCH_SUCCESS",
        data: newData,
      });
    },
  });

  const dataWithDefault = match(data, "data")?.data ?? "No data yet";

  return <div>Data: {dataWithDefault}</div>;
};
```

### Debugging

```ts
import { debugging } from "react-states";

debugging.active = Boolean(import.meta.DEV);
```

You could also implement custom behaviour like a keyboard shortcut, localStorage etc.
