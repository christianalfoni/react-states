import * as React from 'react';
import { useDevtools } from '../src/devtools';
import { useStates, useStateEffect, match, useCommandEffect } from '../src';
import { states } from './states/todos';
import { EnvironmentProvider, useEnvironment } from './environment';
import { browserEnvironment } from './environment/browser';

const Test = () => {
  const { todosApi } = useEnvironment();
  const todos = useStates(states, {
    state: 'NOT_LOADED',
  });

  useDevtools('todos', todos);

  const [state, dispatch] = todos;

  useStateEffect(state, 'LOADING', () => {
    todosApi.fetchTodos();
  });

  useCommandEffect(state, 'SAVE_TODO', ({ todo }) => {
    todosApi.saveTodo(todo);
  });

  return match(state, {
    NOT_LOADED: () => <button onClick={() => dispatch({ type: 'FETCH_TODOS' })}>Fetch Todos</button>,
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
    ERROR: ({ error }) => error,
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
      {state ? (
        <EnvironmentProvider environment={browserEnvironment}>
          <Test />
        </EnvironmentProvider>
      ) : null}
    </div>
  );
}
