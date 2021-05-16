import * as React from 'react';
import { createContext, createHook, createReducer, useEnterEffect, useMatchEffect } from '../src';
import { useDevtools } from '../src/devtools';

type Todo = {
  completed: boolean;
  title: string;
};

const ADDING_TODO = Symbol('ADDING_TODO');

type Context =
  | {
      state: 'LOADED';
      todos: Todo[];
    }
  | {
      state: typeof ADDING_TODO;
      todo: Todo;
      todos: Todo[];
    };

type Event =
  | {
      type: 'TODO_ADDED';
      todo: Todo;
    }
  | {
      type: 'TODOS_FETCHED';
      todos: Todo[];
    };

const reducer = createReducer<Context, Event>({
  LOADED: {
    TODO_ADDED: ({ todo }, { todos }) => ({
      state: ADDING_TODO,
      todo,
      todos,
    }),
  },

  [ADDING_TODO]: ({ todo, todos }) => ({
    state: 'LOADED',
    todos: [todo].concat(todos),
  }),
});

const context = createContext<Context, Event>();

export const useAuth = createHook(context);

export function AuthFeature({ children }: { children: React.ReactNode }) {
  const authStates = React.useReducer(reducer, {
    state: 'LOADED',
    todos: [],
  });

  useDevtools('Todos', authStates);

  const [auth, send] = authStates;

  useEnterEffect(auth, ADDING_TODO, ({ todo }) => {
    console.log('ADDING TODO', todo);
  });

  return <context.Provider value={authStates}>{children}</context.Provider>;
}
