import { implementEnvironment } from '.';

export const browserEnvironment = implementEnvironment({
  todosApi: (emit) => ({
    fetchTodos() {
      setTimeout(() => {
        emit({ type: 'TODOS:FETCH_TODOS_SUCCESS', todos: [] });
      }, 1000);
    },
    saveTodo() {},
  }),
});
