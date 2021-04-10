import * as React from 'react';
import { exec, StatesReducer, transitions } from '../src';
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

type Action =
  | {
      type: 'SIGN_IN';
    }
  | {
      type: typeof SIGN_IN_SUCCESS;
      user: { name: string };
    }
  | {
      type: typeof SIGN_IN_ERROR;
    };

const context = React.createContext({} as StatesReducer<Context, Action>);

export const useAuth = () => React.useContext(context);

const reducer = transitions<Context, Action>({
  UNAUTHENTICATED: {
    SIGN_IN: () => ({ state: 'AUTHENTICATING' }),
  },
  AUTHENTICATING: {
    [SIGN_IN_SUCCESS]: ({ user }) => ({ state: 'AUTHENTICATED', user }),
  },
  AUTHENTICATED: {},
});

export function AuthFeature({ children }: { children: React.ReactNode }) {
  const authReducer = React.useReducer(reducer, {
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
