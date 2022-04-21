import { createReducer, Todo, commands } from '../environment-interface';

const $LOG = ({ message }: { message: string }) => ({
  $LOG: { message },
});

const NOT_LOADED = () => ({
  state: 'NOT_LOADED' as const,
});

const LOADING = () => ({
  state: 'LOADING' as const,
});

const LOADED = ({ todos }: { todos: Todo[] }) => ({
  state: 'LOADED' as const,
  todos,
  $LOG: $LOG({ message: 'HEY' }),
});

const ERROR = ({ error }: { error: string }) => ({
  state: 'ERROR' as const,
  error,
});

export type State = ReturnType<typeof NOT_LOADED | typeof LOADING | typeof LOADED | typeof ERROR>;

type Action =
  | {
      type: 'ADD_TODO';
      todo: Todo;
    }
  | {
      type: 'FETCH_TODOS';
    };

export const reducer = createReducer<State, Action>({
  NOT_LOADED: {
    FETCH_TODOS: () => ({ ...LOADING(), ...commands.todosApi.fetchTodos() }),
  },
  LOADING: {
    'TODOS:FETCH_TODOS_SUCCESS': (_, { todos }) => LOADED({ todos }),
    'TODOS:FETCH_TODOS_ERROR': (_, { error }) => ERROR({ error }),
  },
  LOADED: {
    ADD_TODO: (state, { todo }) => ({
      ...LOADED({ todos: [todo].concat(state.todos) }),
      ...commands.todosApi.saveTodo(todo),
    }),
  },
  ERROR: {},
});
