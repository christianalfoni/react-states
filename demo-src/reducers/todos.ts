import { $COMMAND, PickReturnTypes } from '../../src';
import { createReducer, Todo, commands as envCommands } from '../environment-interface';

const commands = {
  LOG: (message: string) => ({
    cmd: 'LOG' as const,
    message,
  }),
};

export const states = {
  NOT_LOADED: () => ({
    state: 'NOT_LOADED' as const,
    [$COMMAND]: commands.LOG('HEY'),
  }),
  LOADING: () => ({
    state: 'LOADING' as const,
    [$COMMAND]: envCommands.todosApi.fetchTodos(),
  }),
  LOADED: ({ todos }: { todos: Todo[] }) => ({
    state: 'LOADED' as const,
    todos,
  }),
  ERROR: ({ error }: { error: string }) => ({
    state: 'ERROR' as const,
    error,
  }),
};

export type State = PickReturnTypes<typeof states>;

export const actions = {
  ADD_TODO: (todo: Todo) => ({
    type: 'ADD_TODO' as const,
    todo,
  }),
  FETCH_TODOS: () => ({
    type: 'FETCH_TODOS' as const,
  }),
};

type Action = PickReturnTypes<typeof actions>;

export const reducer = createReducer<State, Action>({
  NOT_LOADED: {
    FETCH_TODOS: () => states.LOADING(),
  },
  LOADING: {
    'TODOS:FETCH_TODOS_SUCCESS': (_, { todos }) => states.LOADED({ todos }),
    'TODOS:FETCH_TODOS_ERROR': (_, { error }) => states.ERROR({ error }),
  },
  LOADED: {
    ADD_TODO: (state, { todo }) => ({
      ...states.LOADED({ todos: [todo].concat(state.todos) }),
      [$COMMAND]: envCommands.todosApi.saveTodo(todo),
    }),
  },
  ERROR: {},
});
