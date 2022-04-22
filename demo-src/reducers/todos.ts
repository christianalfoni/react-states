import { transition, TTransitions } from '../../src';
import { Todo, EnvironmentAction } from '../environment-interface';

export type Action =
  | {
      type: 'ADD_TODO';
      todo: Todo;
    }
  | {
      type: 'FETCH_TODOS';
    };

const $SAVE_TODO = (todo: Todo) => ({
  cmd: '$SAVE_TODO' as const,
  todo,
});

export const NOT_LOADED = () => ({
  state: 'NOT_LOADED' as const,
});

const LOADING = () => ({
  state: 'LOADING' as const,
});

const LOADED = ({ todos, newTodo }: { todos: Todo[]; newTodo?: Todo }) => ({
  state: 'LOADED' as const,
  todos,
  $SAVE_TODO: newTodo ? $SAVE_TODO(newTodo) : undefined,
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
    ADD_TODO: (state, { todo }) => LOADED({ todos: [todo].concat(state.todos), newTodo: todo }),
  },
  ERROR: {},
};

export const reducer = (state: State, action: Action) => transition(state, action, transitions);
