import * as React from 'react';
import { useContext } from 'react';
import { createContext, StateTransition, useCommandEffect, useStates } from '../src';
import { useDevtools } from '../src/devtools';

type Todo = {
  completed: boolean;
  title: string;
};

type State = {
  context: 'LOADED';
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

export function AuthFeature({ children }: { children: React.ReactNode }) {
  const authStates = useStates<State, Action, Command>(
    {
      context: 'LOADED',
      todos: [],
    },
    {
      LOADED: {
        ADD_TODO: ({ todo }, state): Transition => [
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
    },
  );

  useDevtools('Todos', authStates);

  const [auth] = authStates;

  useCommandEffect(auth, 'SAVE_TODO', ({ todo }) => {
    console.log('SAVE_TODO', todo);
  });

  return <context.Provider value={authStates}>{children}</context.Provider>;
}
