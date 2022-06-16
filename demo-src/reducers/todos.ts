import { PickState, transition } from '../../src';

type Todo = {
  title: string;
  completed: boolean;
};

type State =
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
      type: 'ADD_TODO';
      todo: Todo;
    }
  | {
      type: 'FETCH_TODOS';
    }
  | {
      type: 'FETCH_TODOS_SUCCESS';
      todos: Todo[];
    }
  | {
      type: 'FETCH_TODOS_ERROR';
      error: string;
    };

export const reducer = (state: State, action: Action) =>
  transition(state, action, {
    NOT_LOADED: {
      FETCH_TODOS: (): PickState<State, 'LOADING'> => ({
        state: 'LOADING',
      }),
    },
    LOADING: {
      FETCH_TODOS_SUCCESS: (_, { todos }): PickState<State, 'LOADED'> => ({
        state: 'LOADED',
        todos,
      }),
      FETCH_TODOS_ERROR: (_, { error }): PickState<State, 'ERROR'> => ({
        state: 'ERROR',
        error,
      }),
    },
    LOADED: {
      ADD_TODO: (state, { todo }): PickState<State, 'LOADED'> => ({
        state: 'LOADED',
        todos: [todo].concat(state.todos),
      }),
    },
    ERROR: {},
  });
