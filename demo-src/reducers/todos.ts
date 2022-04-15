import { StatesReducer } from '../../src';
import { createReducer, Todo } from '../environment-interface';

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

type Command = {
  cmd: 'LOG';
};

type TodosReducer = StatesReducer<State, Action, Command>;

export const reducer = createReducer<TodosReducer>({
  NOT_LOADED: {
    FETCH_TODOS: ({ transition }) =>
      transition({
        state: 'ERROR',
        error: 'test',
      }),
  },
  LOADING: {
    'TODOS:FETCH_TODOS_SUCCESS': ({ action: { todos }, transition }) =>
      transition({
        state: 'LOADED',
        todos,
      }),
    'TODOS:FETCH_TODOS_ERROR': ({ action: { error }, transition }) =>
      transition({
        state: 'ERROR',
        error,
      }),
  },
  LOADED: {
    ADD_TODO: ({ state, action: { todo }, transition }) =>
      transition(
        {
          ...state,
          todos: [todo].concat(state.todos),
        },
        {
          cmd: '$ENVIRONMENT',
          call: 'todosApi.saveTodo',
          params: [todo],
        },
      ),
  },
  ERROR: {},
});
