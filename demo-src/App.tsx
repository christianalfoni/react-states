import * as React from "react";

import { match, createTransitionsHook } from "../src/index";

type Todo = {
  title: string;
  completed: boolean;
};

type State =
  | {
      state: "NOT_LOADED";
    }
  | {
      state: "LOADING";
    }
  | {
      state: "LOADED";
      todos: Todo[];
    }
  | {
      state: "ERROR";
      error: string;
    };

type Action =
  | {
      type: "ADD_TODO";
      todo: Todo;
    }
  | {
      type: "FETCH_TODOS";
    }
  | {
      type: "FETCH_TODOS_SUCCESS";
      todos: Todo[];
    }
  | {
      type: "FETCH_TODOS_ERROR";
      error: string;
    };

type Cmd = {
  cmd: "FETCH_TODOS";
};

const useTransitions = createTransitionsHook<State, Action, Cmd>(
  (transition) => ({
    NOT_LOADED: {
      FETCH_TODOS: () =>
        transition(
          {
            state: "LOADING",
          },
          {
            cmd: "FETCH_TODOS",
          }
        ),
    },
    LOADING: {
      FETCH_TODOS_SUCCESS: ({ todos }) =>
        transition({ state: "LOADED", todos }),
      FETCH_TODOS_ERROR: ({ error }) => transition({ state: "ERROR", error }),
    },
    LOADED: {
      ADD_TODO: ({ todo }, { todos }) =>
        transition({
          state: "LOADED",
          todos: [todo].concat(todos),
        }),
    },
    ERROR: {},
  })
);

const Test = () => {
  const [state, dispatch] = useTransitions(
    {
      FETCH_TODOS: () => {
        setTimeout(
          () =>
            dispatch({
              type: "FETCH_TODOS_SUCCESS",
              todos: [],
            }),
          500
        );
      },
    },
    {
      state: "NOT_LOADED",
    }
  );

  return match(state, {
    NOT_LOADED: () => (
      <button
        onClick={() =>
          dispatch({
            type: "FETCH_TODOS",
          })
        }
      >
        Fetch Todos
      </button>
    ),
    LOADING: () => <h2>Loading...</h2>,
    LOADED: ({ todos }) => (
      <div>
        <button
          onClick={() =>
            dispatch({
              type: "FETCH_TODOS",
            })
          }
        >
          Fetch Todos
        </button>
        <button
          onClick={() => {
            dispatch({
              type: "ADD_TODO",
              todo: {
                completed: false,
                title: "New_" + Date.now(),
              },
            });
          }}
        >
          Add Todo
        </button>
        <ul>
          {todos.map((todo, index) => (
            <li key={index}>{todo.title}</li>
          ))}
        </ul>
      </div>
    ),
    ERROR: ({ error }) => <h4>{error}</h4>,
  });
};

export function App() {
  const [state, setState] = React.useState(true);

  return (
    <div className="App">
      <button
        onClick={() => {
          setState(!state);
        }}
      >
        toggle
      </button>
      {state ? <Test /> : null}
    </div>
  );
}
