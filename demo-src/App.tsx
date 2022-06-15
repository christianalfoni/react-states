import * as React from 'react';

import { match, useDevtools, useTransitionEffect } from '../src';
import { reducer } from './reducers/todos';

const Test = () => {
  const todosReducer = React.useReducer(reducer, {
    state: 'NOT_LOADED',
  });

  useDevtools('Todos', todosReducer);

  const [state, dispatch] = todosReducer;

  useTransitionEffect(state, 'LOADING', () => {
    setTimeout(() => {
      dispatch({
        type: 'FETCH_TODOS_SUCCESS',
        todos: [],
      });
    }, 500);
  });

  useTransitionEffect(state, { action: 'ADD_TODO' }, () => {
    // Do something
  });

  return match(state, {
    NOT_LOADED: ({}) => <button onClick={() => dispatch({ type: 'FETCH_TODOS' })}>Fetch Todos</button>,
    LOADING: () => <h2>Loading...</h2>,
    LOADED: ({ todos }) => (
      <div>
        <button
          onClick={() => {
            dispatch({
              type: 'ADD_TODO',
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
