# Tools

## usePromise

```tsx
import { usePromise, useStateTransition } from 'react-states';

const SomeComponent = () => {
  const [state, execute] = usePromise(() => somePromiseEffect());

  useStateTransition(state, 'RESOLVED', () => {
    console.log('It gotz loaded!');
  });

  return match(state, {
    PENDING: () => 'Loading...',
    RESOLVED: ({ value }) => value,
    REJECTED: ({ error }) => (
      <div>
        {error.message} <button onClick={() => execute()}>Try again</button>
      </div>
    ),
  });
};
```

## useLazyPromise

```tsx
import { usePromise, useStateTransition } from 'react-states';

const SomeComponent = () => {
  const [state, execute] = usePromise(() => somePromiseEffect());

  useStateTransition(state, 'RESOLVED', () => {
    console.log('It gotz loaded!');
  });

  return match(state, {
    IDLE: () => <button onClick={() => execute()}>Load promise</button>,
    PENDING: () => 'Loading...',
    RESOLVED: ({ value }) => value,
    REJECTED: ({ error }) => (
      <div>
        {error.message} <button onClick={() => execute()}>Try again</button>
      </div>
    ),
  });
};
```
