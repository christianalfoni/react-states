import { createEnvironment } from '../environment-interface';

export const browserEnvironment = createEnvironment((emit) => ({
  todosApi: {
    fetchTodos() {
      setTimeout(() => {
        emit({ type: 'TODOS:FETCH_TODOS_SUCCESS', todos: [] });
      }, 1000);
    },
    saveTodo() {},
  },
}));
