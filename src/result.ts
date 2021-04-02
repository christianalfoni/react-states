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

export const RESOLVER_PROMISE = Symbol('RESOLVER_PROMISE')

export function result<V, E extends ErrorValue>(cb: (
  ok: (value: V) => Ok<V>,
  err: (...args: E extends { data: infer D } ? [type: E["type"], data: D] : [type: E["type"]]) => Err<E>,
) => Promise<Ok<V> | Err<E>>): Result<V, E> {
  let isCancelled = false;
  let currentDisposer = () => {
    isCancelled = true;
  };
  let currentPromise = new Promise<Ok<V> | Err<E>>((resolve, reject) => {
    cb(ok, err as any)
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
      currentPromise.then(result => {
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
      


      const disposer = Object.assign(() => {
        currentDisposer();
      }, {
        [RESOLVER_PROMISE]: currentPromise
      })

      return disposer
    },
    promise: currentPromise,
    cancel: () => {
      currentDisposer();
    },
  };
}

export type ResultMock<T extends (...args: any[]) => Result<any, any>> = T & {
  ok: (value: ReturnType<T> extends Result<infer V, any> ? V : never) => void;
  err: (err: ReturnType<T> extends Result<any, infer E> ? E : never) => void;
};

export const createResultMock = <T extends (...args: any[]) => Result<any, any>>(): T & {
  ok: (value: ReturnType<T> extends Result<infer V, any> ? V : never) => void;
  err: (...err: ReturnType<T> extends Result<any, infer E> ? E extends { data: infer D } ? [type: E["type"], data: D] : [type: E["type"]] : never) => void;
} => {
  let resolve!: any;
  const fn = () =>
    result(
      () => new Promise(r => {
        resolve = r;
      }),
    );

  fn.ok = (value: any) => {
    if (!resolve) {
      throw new Error(`The MOCK resolving to OK ${JSON.stringify(value)} has not been called yet`)
    }
    resolve(ok(value))
  };
  fn.err = (error: any) => {
    if (!resolve) {
      throw new Error(`The MOCK resolving to ERR ${JSON.stringify(err)} has not been called yet`)
    }
    resolve(err(error))
  };

  return fn as any;
};
