import { States, StatesTransition } from '../../src';
import { createReducer, Todo } from '../environment';

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
    };

type Command =
  | {
      cmd: 'SAVE_TODO';
      todo: Todo;
    }
  | {
      cmd: 'LOG';
    };

type TodosReducer = States<State, Action, Command>;

type Transition = StatesTransition<TodosReducer>;

export const reducer = createReducer<TodosReducer>({
  NOT_LOADED: {
    FETCH_TODOS: (): Transition => ({
      state: 'LOADING',
    }),
  },
  LOADING: {
    'TODOS:FETCH_TODOS_SUCCESS': (_, { todos }): Transition => ({
      state: 'LOADED',
      todos,
    }),
    'TODOS:FETCH_TODOS_ERROR': (_, { error }): Transition => ({
      state: 'ERROR',
      error,
    }),
  },
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
  ERROR: {},
});
