# Concepts

- [Explicit states](#explicit-states)
- [Environment interface](#environment-interface)
- [Subscriptions](#subscriptions)

## Explicit states

Instead of writing code like this:

```tsx
type State = {
  data?: string[]
  isLoading: boolean
  error?: string  
}

type Action = {
  type: 'SET_LOADING_DATA'
} | {
  type: 'LOAD_DATA_SUCCESS',
  data: string[]
} | {
  type: 'LOAD_DATA_ERROR',
  error: string
}

const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'SET_LOADING_DATA':
      return { ...state, isLoading: true }
    case 'LOAD_DATA_SUCCESS':
      return { ...state, isLoading: false, data: action.data }
    case 'LOAD_DATA_ERROR':
      return { ...state, isLoading: false, error: action.error }
  }
  
  return state
}

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, { isLoading: false })
  
  const loadData = async () => {
    dispatch({ type: 'SET_LOADING_DATA' })
    fetch('/api/data')
      .then((response) => response.json())
      .then((data) => dispatch({
        type: 'LOAD_DATA_SUCCESS',
        data
      }))
      .catch((error) => dispatch({
        type: 'LOAD_DATA_ERROR',
        error: error.message
      }))
  }
  
  return (
    <div>
      <button onClick={() => loadData()}>Load data</button>
      {state.isLoading ? <div>Loading...</div> : null}
      {state.data ? <div>{state.data.join(',')}</div> : null}
      {state.error ? <div>{state.error}</div> : null}
    </div>
  )
}
```

You write code like this:

```tsx
import {
  States,
  createReducer,
  useCommandEffect
} from '@codesandbox/react-states'

type State = {
  state: 'NOT_LOADED'
} | {
  state: 'LOADING'
} | {
  state: 'LOADED'
  data: string[]
} | {
  state: 'ERROR'
  error: string
}

type Action = {
  type: 'LOAD_DATA'
} | {
  type: 'LOAD_DATA_SUCCESS',
  data: string[]
} | {
  type: 'LOAD_DATA_ERROR',
  error: string
}

type Command = {
  cmd: 'LOAD_DATA'
}

type DataFetcher = States<State, Action, Command>

const reducer = createReducer<DataFetcher>({
  NOT_LOADED: {
    LOAD_DATA: () => [{ state: 'LOADING' }, { cmd: 'LOAD_DATA' }]
  },
  LOADING: {
    LOAD_DATA_SUCCESS: (_, { data }) => ({
      state: 'LOADED',
      data
    }),
    LOAD_DATA_ERROR: (_, { error }) => ({
      state: 'ERROR',
      error
    })
  },
  LOADED: {},
  ERROR: {}
})

export const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, { state: 'NOT_LOADED' })
  
  useCommandEffect(state, 'LOAD_DATA', () => {
    fetch('/api/data')
      .then((response) => response.json())
      .then((data) => dispatch({
        type: 'LOAD_DATA_SUCCESS',
        data
      }))
      .catch((error) => dispatch({
        type: 'LOAD_DATA_ERROR',
        error: error.message
      }))
  })
  
  return (
    <div>
      <button onClick={() => dispatch({ type: 'LOAD_DATA' })}>
        Load data
      </button>
      <div>
        {match(state, {
          NOT_LOADED: () => 'Data not loaded',
          LOADING: () => 'Loading...',
          LOADED: ({ data }) => data.join(', '),
          ERROR: ({ error }) => error
        })}
      </div>
    </div>
  )
}
```

Creating a reducer with explicit states gives the following benefits:

- You are explicit about what states the reducer can be in
- You avoid `undefined` and `null` checking
- All state changes and effects are guarded
- Everything is a dispatch, no callbacks
- As a provider you can just expose the reducer, ensuring optimal reconciliation
- The `match` is exhaustive, meaning any change to your state in risk of breaking the UI will become a type error

## Environment interface

Instead of writing code like this:

```tsx
import { useEffect } from 'react'

export const SomeComponent = () => {
  const [state, dispatch] = useReducer(() = {}, {})
  
  useEffect(() => {
    fetch('/api/data')
      .then((response) => response.json())
      .then((data) => dispatch({
        type: 'FETCH_DATA_SUCCESS',
        data
      }))
  }, [])
  
  return <div/>
}
```

You write code like this:

```tsx
import { useEffect } from 'react'
import { useEnvironment } from '../environment'

export const App = () => {
  const [state, dispatch] = useReducer(() = {}, {})
  const { api } = useEnvironment()
  
  useEffect(() => {
    api.fetchData()
      .then((data) => dispatch({
        type: 'FETCH_DATA_SUCCESS',
        data
      }))
  }, [])
  
  return <div/>
}
```

Creating an environment interface gives the following benefits:

- Your application code is more explicit
- You avoid environment specific APIs in your application code
- You avoid random strings
- You improve the testability of your application
- Your application can run server side, client side or any other environment you might desire

## Subscriptions

Instead of writing code like this:

```tsx
import { useEffect } from 'react'

export const SomeComponent = () => {
  const [state, dispatch] = useReducer(() = {}, {})
  
  useEffect(() => {
    fetch('/api/data')
      .then((response) => response.json())
      .then((data) => dispatch({
        type: 'FETCH_DATA_SUCCESS',
        data
      }))
  }, [])
  
  return <div/>
}
```

You write code like this:

```tsx
import { useEffect } from 'react'
import { useSubscription } from '@codesandbox/react-states'
import { useEnvironment } from '../environment'

export const SomeComponent = () => {
  const [state, dispatch] = useReducer(() = {}, {})
  const { api } = useEnvironment()
  
  useSubscription(api.subscription, dispatch)
  
  useEffect(() => api.fetchData(), [])
  
  return <div/>
}
```

Creating subscriptions gives the following benefits:

- You avoid situations where promises resolve after component unmount
- Any component can deal with any subscription event, regardless of where it was triggered
- Encourages explicit error events
- No more async tests, events can be simulated and fired synchronously