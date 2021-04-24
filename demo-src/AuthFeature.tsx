import * as React from 'react';
import {
  exec,
  transitions,
  createExperimentalTransitionsReducerContext,
  createExperimentalTransitionsReducerHook,
  useExperimentalTransitionsReducer,
} from '../src';
import { useDevtools } from '../src/devtools';

type Context =
  | {
      state: 'UNAUTHENTICATED';
    }
  | {
      state: 'AUTHENTICATING';
    }
  | {
      state: 'AUTHENTICATED';
      user: { name: string };
    };

const SIGN_IN_SUCCESS = Symbol('SIGN_IN_SUCCESS');
const SIGN_IN_ERROR = Symbol('SIGN_IN_ERROR');

type Event =
  | {
      type: 'SIGN_IN';
    }
  | {
      type: 'UPDATE_NAME';
    }
  | {
      type: typeof SIGN_IN_SUCCESS;
      user: { name: string };
    }
  | {
      type: typeof SIGN_IN_ERROR;
    };

const context = createExperimentalTransitionsReducerContext<Context, Event>();

export const useAuth = createExperimentalTransitionsReducerHook(context);

const reducer = transitions<Context, Event>({
  UNAUTHENTICATED: {
    SIGN_IN: () => ({ state: 'AUTHENTICATING' }),
  },
  AUTHENTICATING: {
    [SIGN_IN_SUCCESS]: ({ user }) => ({ state: 'AUTHENTICATED', user }),
  },
  AUTHENTICATED: {
    UPDATE_NAME: () => ({
      state: 'AUTHENTICATED',
      user: { name: 'BOB' },
    }),
  },
});

export function AuthFeature({ children }: { children: React.ReactNode }) {
  const authReducer = useExperimentalTransitionsReducer(reducer, {
    state: 'UNAUTHENTICATED',
  });

  useDevtools('Auth', authReducer);

  const [auth, dispatch] = authReducer;

  React.useEffect(
    () =>
      exec(auth, {
        AUTHENTICATING: function authenticate() {
          new Promise((resolve) => setTimeout(resolve, 1000)).then(() => {
            dispatch({ type: SIGN_IN_SUCCESS, user: { name: 'Alice' } });
          });
        },
      }),
    [auth],
  );

  return <context.Provider value={authReducer}>{children}</context.Provider>;
}
