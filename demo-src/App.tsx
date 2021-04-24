import * as React from 'react';
import { useAuth } from './AuthFeature';

const Test = () => {
  const [auth, send] = useAuth('AUTHENTICATED');

  return (
    <h2
      onClick={() => {
        send({
          type: 'UPDATE_NAME',
        });
      }}
    >
      Start editing to see some magic {auth.user.name}!
    </h2>
  );
};

export function App() {
  const [auth, dispatch] = useAuth();

  return (
    <div className="App">
      <h1 onClick={() => dispatch({ type: 'SIGN_IN' })}>Hello {auth.state}</h1>
      {auth.state === 'AUTHENTICATED' ? <Test /> : null}
    </div>
  );
}
