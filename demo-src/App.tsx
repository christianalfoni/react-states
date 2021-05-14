import * as React from 'react';
import { useAuth } from './AuthFeature';

const Test = () => {
  const [auth, send] = useAuth('LOADED');

  return (
    <h2
      onClick={() => {
        send({
          type: 'TODO_ADDED',
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
