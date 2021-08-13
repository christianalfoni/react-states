import * as React from 'react';
import { match } from '../src';
import { useAuth } from './AuthFeature';

const Test = () => {
  const [auth, send] = useAuth();

  match(auth, {
    LOADED: () => null,
  });

  return (
    <h2
      onClick={() => {
        send({
          type: 'ADD_TODO',
          todo: {
            completed: true,
            title: 'Awesome',
          },
        });
      }}
    >
      Start editing to see some magic!
    </h2>
  );
};

export function App() {
  const [auth, dispatch] = useAuth();

  return (
    <div className="App">
      <Test />
    </div>
  );
}
