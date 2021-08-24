import * as React from 'react';
import { useContext } from 'react';
import { createContext, StateTransition, transition, Transitions, useCommandEffect, useStates } from '../src';
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

const context = createContext<State, Action>();

export const useAuth = () => useContext(context);

const transitions: Transitions<State, Action, Command> = {
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
};

export function AuthFeature({ children }: { children: React.ReactNode }) {
  const authStates = useStates(transitions, {
    state: 'LOADED',
    todos: [],
  });

  useDevtools('Todos', authStates);

  const [auth] = authStates;

  useCommandEffect(auth, 'SAVE_TODO', ({ todo }) => {
    console.log('SAVE_TODO', todo);
  });

  return <context.Provider value={authStates}>{children}</context.Provider>;
}
