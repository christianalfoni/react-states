import { $COMMAND, transition, TTransitions } from '../../src';
import { Todo, commands, EnvironmentAction } from '../environment-interface';

export type Action =
  | {
      type: 'ADD_TODO';
      todo: Todo;
    }
  | {
      type: 'FETCH_TODOS';
    };

const $LOG = (message: string) => ({
  cmd: '$LOG' as const,
  message,
});

export const NOT_LOADED = () => ({
  state: 'NOT_LOADED' as const,
  [$COMMAND]: $LOG('HEY'),
});

const LOADING = () => ({
  state: 'LOADING' as const,
  [$COMMAND]: commands.todosApi.fetchTodos(),
});

const LOADED = ({ todos }: { todos: Todo[] }) => ({
  state: 'LOADED' as const,
  todos,
});

const ERROR = ({ error }: { error: string }) => ({
  state: 'ERROR' as const,
  error,
});

export type State = ReturnType<typeof NOT_LOADED | typeof LOADING | typeof LOADED | typeof ERROR>;

const transitions: TTransitions<State, Action | EnvironmentAction> = {
  NOT_LOADED: {
    FETCH_TODOS: () => LOADING(),
  },
  LOADING: {
    'TODOS:FETCH_TODOS_SUCCESS': (_, { todos }) => LOADED({ todos }),
    'TODOS:FETCH_TODOS_ERROR': (_, { error }) => ERROR({ error }),
  },
  LOADED: {
    ADD_TODO: (state, { todo }) => ({
      ...LOADED({ todos: [todo].concat(state.todos) }),
      [$COMMAND]: commands.todosApi.saveTodo(todo),
    }),
  },
  ERROR: {},
};

export const reducer = (state: State, action: Action) => transition(state, action, transitions);
