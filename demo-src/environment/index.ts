import { createEnvironment } from '../../src/';

export type Todo = {
  completed: boolean;
  title: string;
};

type TodosApiAction =
  | {
      type: 'TODOS:FETCH_TODOS_SUCCESS';
      todos: Todo[];
    }
  | {
      type: 'TODOS:FETCH_TODOS_ERROR';
      error: string;
    };

export type TodosApi = {
  fetchTodos(): void;
  saveTodo(todos: Todo): void;
};

export type Environment = {
  todosApi: TodosApi;
};

export type EnvironmentAction = TodosApiAction;

const { EnvironmentProvider, createStates, implementEnvironment, useEnvironment } = createEnvironment<
  Environment,
  EnvironmentAction
>();

export { EnvironmentProvider, createStates, implementEnvironment, useEnvironment };
