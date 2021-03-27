export type Resolve<V, E extends ErrorValue> = (
  ok: (value: V) => (() => void) | void,
  err: {
    [T in E['type']]: (error: E extends { type: T } ? E['data'] : never) => void;
  } & {
    CANCELLED?: () => void;
  },
) => () => void;

export type ErrorValue = {
  type: string;
  data?: any;
};

export type Ok<V> = {
  ok: true;
  value: V;
};

export type Err<E extends ErrorValue> = {
  ok: false;
  error:
    | E
    | {
        type: 'CANCELLED';
      };
};

export type Result<V, E extends ErrorValue> = {
  promise: Promise<Ok<V> | Err<E>>;
  cancel: () => void;
  resolve: Resolve<V, E>;
};

const CANCELLED_ERROR = 'CANCELLED' as const;

export function ok<V>(value: V): Ok<V> {
  return {
    ok: true,
    value,
  };
}

export function err<E extends string>(type: E): Err<{ type: E }>;
export function err<E extends string, D extends any>(type: E, data: D): Err<{ type: E; data: D }>;
export function err<E extends string, D extends any>(type: E, data?: D): Err<{ type: E; data?: D }> {
  return {
    ok: false,
    error: {
      type,
      data,
    },
  };
}

export function result<V, E extends ErrorValue>(promise: Promise<Ok<V> | Err<E>>): Result<V, E> {
  let isCancelled = false;
  let currentDisposer = () => {
    isCancelled = true;
  };

  const wrappedPromise = new Promise<Ok<V> | Err<E>>((resolve, reject) => {
    promise
      .then(result =>
        resolve(
          isCancelled
            ? {
                ok: false,
                error: {
                  type: CANCELLED_ERROR,
                },
              }
            : result,
        ),
      )
      .catch(error => {
        if (!isCancelled) {
          // If the promise passed in throws an error reject our promise, which
          // will lead to an unhandled promise exception... but, you should already
          // have catched this in your result implementation to give specific errors
          reject(error);
        }

        resolve({
          ok: false,
          error: {
            type: CANCELLED_ERROR,
          },
        });
      });
  });

  return {
    resolve: (resolveOk, errors) => {
      wrappedPromise.then(result => {
        if (result.ok) {
          const disposer = resolveOk(result.value);

          if (disposer) {
            currentDisposer = disposer;
          }
        } else {
          const errorType = result.error.type;
          // @ts-ignore
          const err = errors[errorType];

          err && err('data' in result.error ? result.error.data : undefined);
        }
      });
      return () => {
        currentDisposer();
      };
    },
    promise: wrappedPromise,
    cancel: () => {
      currentDisposer();
    },
  };
}
