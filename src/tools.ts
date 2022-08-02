import { useReducer } from 'react';
import { $ACTION, $PREV_STATE, $TRANSITIONS } from './constants';
import { useStateTransition, useDevtools } from './hooks';
import { transition } from './utils';

export type PromiseState<T> =
  | {
      state: 'PENDING';
    }
  | {
      state: 'RESOLVED';
      value: T;
    }
  | {
      state: 'REJECTED';
      error: unknown;
    };

export type LazyPromiseState<T> =
  | {
      state: 'IDLE';
    }
  | PromiseState<T>;

export type PromiseAction<T> =
  | {
      type: 'EXECUTE';
    }
  | {
      type: 'RESOLVE';
      value: T;
    }
  | {
      type: 'REJECT';
      error: unknown;
    };

export const usePromise = <T extends (...params: any[]) => Promise<any>>(
  cb: T,
  deps: unknown[] = [],
): readonly [
  PromiseState<Awaited<ReturnType<T>>> & {
    [$ACTION]?: PromiseAction<Awaited<ReturnType<T>>>;
    [$PREV_STATE]?: PromiseState<Awaited<ReturnType<T>>>;
    [$TRANSITIONS]?: {
      PENDING: {
        RESOLVE: 'RESOLVED';
        REJECT: 'REJECTED';
      };
      RESOLVED: {
        EXECUTE: 'PENDING';
      };
      REJECTED: {
        EXECUTE: 'PENDING';
      };
    };
  },
  () => void,
] => {
  const promiseReducer = useReducer(
    (prevState: PromiseState<Awaited<ReturnType<T>>>, action: PromiseAction<Awaited<ReturnType<T>>>) =>
      transition(prevState, action, {
        PENDING: {
          RESOLVE: (_, { value }) => ({
            state: 'RESOLVED',
            value,
          }),
          REJECT: (_, { error }) => ({
            state: 'REJECTED',
            error,
          }),
        },
        RESOLVED: {
          EXECUTE: () => ({
            state: 'PENDING',
          }),
        },
        REJECTED: {
          EXECUTE: () => ({
            state: 'PENDING',
          }),
        },
      }),
    {
      state: 'PENDING',
    },
  );

  useDevtools(cb.name, promiseReducer);

  const [state, dispatch] = promiseReducer;

  useStateTransition(
    state,
    'PENDING',
    () => {
      cb()
        .then((value) => dispatch({ type: 'RESOLVE', value }))
        .catch((error) => dispatch({ type: 'REJECT', error }));
    },
    deps,
  );

  return [state, () => dispatch({ type: 'EXECUTE' })] as const;
};

export const useLazyPromise = <T extends () => Promise<any>>(
  cb: T,
  deps: unknown[] = [],
): readonly [
  LazyPromiseState<Awaited<ReturnType<T>>> & {
    [$ACTION]?: PromiseAction<Awaited<ReturnType<T>>>;
    [$PREV_STATE]?: LazyPromiseState<Awaited<ReturnType<T>>>;
    [$TRANSITIONS]?: {
      IDLE: {
        EXECUTE: 'PENDING';
      };
      PENDING: {
        RESOLVE: 'RESOLVED';
        REJECT: 'REJECTED';
      };
      RESOLVED: {
        EXECUTE: 'PENDING';
      };
      REJECTED: {
        EXECUTE: 'PENDING';
      };
    };
  },
  () => void,
] => {
  const promiseReducer = useReducer(
    (prevState: LazyPromiseState<Awaited<ReturnType<T>>>, action: PromiseAction<Awaited<ReturnType<T>>>) =>
      transition(prevState, action, {
        IDLE: {
          EXECUTE: () => ({
            state: 'PENDING',
          }),
        },
        PENDING: {
          RESOLVE: (_, { value }) => ({
            state: 'RESOLVED',
            value,
          }),
          REJECT: (_, { error }) => ({
            state: 'REJECTED',
            error,
          }),
        },
        RESOLVED: {
          EXECUTE: () => ({
            state: 'PENDING',
          }),
        },
        REJECTED: {
          EXECUTE: () => ({
            state: 'PENDING',
          }),
        },
      }),
    {
      state: 'IDLE',
    },
  );

  useDevtools(cb.name, promiseReducer);

  const [state, dispatch] = promiseReducer;

  useStateTransition(
    state,
    'PENDING',
    () => {
      cb()
        .then((value) => dispatch({ type: 'RESOLVE', value }))
        .catch((error) => dispatch({ type: 'REJECT', error }));
    },
    deps,
  );

  return [state, () => dispatch({ type: 'EXECUTE' })] as const;
};
