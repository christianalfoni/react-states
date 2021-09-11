import * as React from 'react';
import { useReducer } from 'react';
import { useContext } from 'react';
import { createReducerContext, StateTransition, Transitions, useCommandEffect, createReducer } from '../src';
import { useDevtools } from '../src/devtools';

type Todo = {
  completed: boolean;
  title: string;
};

type State = {
  state: 'LOADED';
  todos: Todo[];
};

type Action =
  | {
      type: 'ADD_TODO';
      todo: Todo;
    }
  | {
      type: 'FETCH_TODOS';
      todos: Todo[];
    };

type Command = {
  cmd: 'SAVE_TODO';
  todo: Todo;
};

type Transition = StateTransition<State, Command>;

const reducerContext = createReducerContext<State, Action>();

export const useAuth = () => useContext(reducerContext);

const reducer = createReducer<State, Action, Command>({
  LOADED: {
    ADD_TODO: (state, { todo }): Transition => [
      {
        ...state,
        todos: [todo].concat(state.todos),
      },
      {
        cmd: 'SAVE_TODO',
        todo,
      },
    ],
  },
});

export function AuthFeature({ children }: { children: React.ReactNode }) {
  const authStates = useReducer(reducer, {
    state: 'LOADED',
    todos: [],
  });

  useDevtools('Todos', authStates);

  const [auth] = authStates;

  useCommandEffect(auth, 'SAVE_TODO', ({ todo }) => {
    console.log('SAVE_TODO', todo);
  });

  return <reducerContext.Provider value={authStates}>{children}</reducerContext.Provider>;
}
