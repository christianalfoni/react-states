import { createStates, createActions, StatesUnion, ActionsUnion, transition } from '../../src';

type Todo = {
  title: string;
  completed: boolean;
};

export const states = createStates({
  NOT_LOADED: () => ({}),
  LOADING: () => ({}),
  LOADED: (todos: Todo[]) => ({ todos }),
  ERROR: (error: string) => ({ error }),
});

type State = StatesUnion<typeof states>;

export const actions = createActions({
  addTodo: (todo: Todo) => ({ todo }),
  fetchTodos: () => ({}),
  fetchTodosSuccess: (todos: Todo[]) => ({ todos }),
  fetchTodosError: (error: string) => ({ error }),
});

type Action = ActionsUnion<typeof actions>;

export const reducer = (state: State, action: Action) =>
  transition(state, action, {
    NOT_LOADED: {
      fetchTodos: () => states.LOADING(),
    },
    LOADING: {
      fetchTodosSuccess: (_, { todos }) => states.LOADED(todos),
      fetchTodosError: (_, { error }) => states.ERROR(error),
    },
    LOADED: {
      addTodo: (state, { todo }) => states.LOADED([todo].concat(state.todos)),
    },
    ERROR: {},
  });
