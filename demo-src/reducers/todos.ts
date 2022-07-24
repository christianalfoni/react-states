import { transition } from '../../src';

type Todo = {
  title: string;
  completed: boolean;
};

export type State =
  | {
      state: 'NOT_LOADED';
    }
  | {
      state: 'LOADING';
    }
  | {
      state: 'LOADED';
      todos: Todo[];
    }
  | {
      state: 'ERROR';
      error: string;
    };

type Action =
  | {
      type: 'addTodo';
      todo: Todo;
    }
  | {
      type: 'fetchTodos';
    }
  | {
      type: 'fetchTodosSuccess';
      todos: Todo[];
    }
  | {
      type: 'fetchTodosError';
      error: string;
    };

export const reducer = (state: State, action: Action) =>
  transition(state, action, {
    NOT_LOADED: {
      fetchTodos: () => ({
        state: 'LOADING',
      }),
    },
    LOADING: {
      fetchTodosSuccess: (_, { todos }) => ({
        state: 'LOADED',
        todos,
      }),
      fetchTodosError: (_, { error }) => ({
        state: 'ERROR',
        error,
      }),
    },
    LOADED: {
      addTodo: (state, { todo }) => ({
        state: 'LOADED',
        todos: [todo].concat(state.todos),
      }),
    },
    ERROR: {},
  });
