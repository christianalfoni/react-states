import * as React from 'react';
import { useStates } from '../src';
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

export function App() {
  const auth = useStates<Context, Action>(
    {
      UNAUTHENTICATED: {
        SIGN_IN: () => ({ state: 'AUTHENTICATING' }),
      },
      AUTHENTICATING: {
        SIGN_IN_SUCCESS: ({ user }) => ({ state: 'AUTHENTICATED', user }),
      },
      AUTHENTICATED: {},
    },
    {
      state: 'UNAUTHENTICATED',
    },
  );

  useDevtools('Auth', auth);

  React.useEffect(
    () =>
      auth.exec({
        AUTHENTICATING: function authenticate() {
          new Promise(resolve => setTimeout(resolve, 1000)).then(() => {
            auth.dispatch({ type: 'SIGN_IN_SUCCESS', user: { name: 'Alice' } });
          });
        },
      }),
    [auth],
  );

  return (
    <div className="App">
      <h1 onClick={() => auth.dispatch({ type: 'SIGN_IN' })}>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
