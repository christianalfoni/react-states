import { PickCommand, PickReturnTypes, transition, TTransitions } from '../../src';
import { Todo, EnvironmentAction } from '../environment-interface';

const actions = {
  ADD_TODO: (todo: Todo) => ({
    type: 'ADD_TODO' as const,
    todo,
  }),
  FETCH_TODOS: () => ({
    type: 'FETCH_TODOS' as const,
  }),
};

type Action = PickReturnTypes<typeof actions>;

const commands = {
  $SAVE_TODO: (todo: Todo) => ({
    cmd: '$SAVE_TODO' as const,
    todo,
  }),
};

type Commands = PickReturnTypes<typeof commands>;

const states = {
  NOT_LOADED: () => ({
    state: 'NOT_LOADED' as const,
    FETCH_TODOS: actions.FETCH_TODOS,
  }),
  LOADING: () => ({
    state: 'LOADING' as const,
  }),
  LOADED: ({ todos, $SAVE_TODO }: { todos: Todo[]; $SAVE_TODO?: PickCommand<Commands, '$SAVE_TODO'> }) => ({
    state: 'LOADED' as const,
    todos,
    $SAVE_TODO,
    ADD_TODO: actions.ADD_TODO,
  }),
  ERROR: ({ error }: { error: string }) => ({
    state: 'ERROR' as const,
    error,
  }),
};

export type State = PickReturnTypes<typeof states>;

export const { NOT_LOADED, LOADED, LOADING, ERROR } = states;

const transitions: TTransitions<State, Action | EnvironmentAction> = {
  NOT_LOADED: {
    FETCH_TODOS: () => LOADING(),
  },
  LOADING: {
    'TODOS:FETCH_TODOS_SUCCESS': (_, { todos }) => LOADED({ todos }),
    'TODOS:FETCH_TODOS_ERROR': (_, { error }) => ERROR({ error }),
  },
  LOADED: {
    ADD_TODO: (state, { todo }) => LOADED({ todos: [todo].concat(state.todos), $SAVE_TODO: commands.$SAVE_TODO(todo) }),
  },
  ERROR: {},
};

export const reducer = (state: State, action: Action) => transition(state, action, transitions);
