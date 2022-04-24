import {
  ReturnTypes,
  IAction,
  ICommand,
  transition,
  IState,
  TTransitions,
  pick,
  PickCommand,
  $COMMAND,
} from '../../src';
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

type Action = ReturnTypes<typeof actions, IAction>;

const commands = {
  SAVE_TODO: (todo: Todo) => ({
    cmd: 'SAVE_TODO' as const,
    todo,
  }),
};

type Command = ReturnTypes<typeof commands, ICommand>;

const states = {
  NOT_LOADED: () => ({
    state: 'NOT_LOADED' as const,
    ...pick(actions, 'FETCH_TODOS'),
  }),
  LOADING: () => ({
    state: 'LOADING' as const,
  }),
  LOADED: (params: { todos: Todo[]; [$COMMAND]?: PickCommand<Command, 'SAVE_TODO'> }) => ({
    state: 'LOADED' as const,
    ...params,
    ...pick(actions, 'ADD_TODO'),
  }),
  ERROR: ({ error }: { error: string }) => ({
    state: 'ERROR' as const,
    error,
  }),
};

export type State = ReturnTypes<typeof states, IState>;

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
    ADD_TODO: (state, { todo }) => LOADED({ todos: [todo].concat(state.todos), [$COMMAND]: commands.SAVE_TODO(todo) }),
  },
  ERROR: {},
};

export const reducer = (state: State, action: Action) => transition(state, action, transitions);
