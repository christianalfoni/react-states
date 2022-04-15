import * as React from 'react';

import { match } from '../src';
import { reducer } from './reducers/todos';
import { EnvironmentProvider, useReducer } from './environment-interface';
import { browserEnvironment } from './environments/browser';

const Test = () => {
  const [state, dispatch] = useReducer('todos', reducer, {
    state: 'NOT_LOADED',
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
      {state ? (
        <EnvironmentProvider environment={browserEnvironment}>
          <Test />
        </EnvironmentProvider>
      ) : null}
    </div>
  );
}
