import * as React from 'react';
import { useAuth } from './AuthFeature';

export function App() {
  const [auth, dispatch] = useAuth();

  return (
    <div className="App">
      <h1 onClick={() => dispatch({ type: 'SIGN_IN' })}>Hello {auth.state}</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
