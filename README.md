# react-states

> Explicit states for predictable user experiences

## Install

```sh
npm install react-states
```

## Description

Enhance your reducer with transitions. Transitions creates additional constraints and explicitness in your code. By only allowing certain actions to run in certain states and control what effects run from your reducer, you give your reducer full control of how the state of the application moves forward.

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

export const useData = createTransitions<State, Action, Cmd>()({
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

  const partialMatch = match(
    data,
    {
      LOADED: ({ data }) => data,
    },
    (otherStates) => []
  );

  const matchByKey = match(data, "data")?.data ?? [];

  const exhaustiveMatch = match(data, {
    NOT_LOADED: () => (
      <button onClick={() => dispatch({ type: "LOAD" })}>Load data</button>
    ),
    LOADING: () => "Loading...",
    LOADED: ({ data }) => (
      <ul>
        {data.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    ),
    ERROR: ({ error }) => <span style={{ color: "red" }}>{error}</span>,
  });

  return <div />;
};
```

### Debugging

```ts
import { debugging } from "react-states";

debugging.active = Boolean(import.meta.DEV);
```

You could also implement custom behaviour like a keyboard shortcut, localStorage etc.
