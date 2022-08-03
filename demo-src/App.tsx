import * as React from 'react';

import { match, useStateTransition, useDevtools } from '../src';

import { reducer } from './reducers/todos';

const Test = () => {
  const todosReducer = React.useReducer(reducer, {
    state: 'NOT_LOADED',
  });

  useDevtools('Todos', todosReducer);

  const [state, dispatch] = todosReducer;

  useStateTransition(state, 'LOADING', () => {
    setTimeout(() => dispatch({ type: 'fetchTodosSuccess', todos: [] }), 500);
  });

  useStateTransition(
    state,
    {
      LOADED: {
        addTodo: 'LOADED',
      },
    },
    () => {
      // Do something
    },
  );

  return match(state, {
    NOT_LOADED: ({}) => <button onClick={() => dispatch({ type: 'fetchTodos' })}>Fetch Todos</button>,
    LOADING: () => <h2>Loading...</h2>,
    LOADED: ({ todos }) => (
      <div>
        <button onClick={() => dispatch({ type: 'fetchTodos' })}>Fetch Todos</button>
        <button
          onClick={() => {
            dispatch({
              type: 'addTodo',
              todo: {
                completed: false,
                title: 'New_' + Date.now(),
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
