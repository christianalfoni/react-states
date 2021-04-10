import * as React from 'react';
import { exec, transition } from '../src';
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

type Action =
  | {
      type: 'SIGN_IN';
    }
  | {
      type: 'SIGN_IN_SUCCESS';
      user: { name: string };
    }
  | {
      type: 'SIGN_IN_ERROR';
    };

const context = React.createContext({} as [Context, React.Dispatch<Action>]);

export const useAuth = () => React.useContext(context);

export function AuthFeature({ children }: { children: React.ReactNode }) {
  const authReducer = React.useReducer(
    (context: Context, action: Action) =>
      transition(context, action, {
        UNAUTHENTICATED: {
          SIGN_IN: () => ({ state: 'AUTHENTICATING' }),
        },
        AUTHENTICATING: {
          SIGN_IN_SUCCESS: ({ user }) => ({ state: 'AUTHENTICATED', user }),
        },
        AUTHENTICATED: {},
      }),
    {
      state: 'UNAUTHENTICATED',
    },
  );

  useDevtools('Auth', authReducer);

  const [auth, dispatch] = authReducer;

  React.useEffect(
    () =>
      exec(auth, {
        AUTHENTICATING: function authenticate() {
          new Promise(resolve => setTimeout(resolve, 1000)).then(() => {
            dispatch({ type: 'SIGN_IN_SUCCESS', user: { name: 'Alice' } });
          });
        },
      }),
    [auth],
  );

  return <context.Provider value={authReducer}>{children}</context.Provider>;
}
