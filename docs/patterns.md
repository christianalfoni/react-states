# Patterns

- [Provider](#Provider)
- [Public Provider](#Public-Provider)
    
## Provider

Expose the reducer on a React context.

```tsx
import { createContext, useReducer } from 'react'
import { States, StateTransition, createReducer } from 'react-states'

type State = {
    state: 'FOO'
} | {
    state: 'BAR'
}

type Action = {
    type: 'SWITCH'
}


export type Switcher = States<State, Action>

type Transition = StateTransition<Switcher>

type SwitcherProviderProps = {
    initialState?: State
}

const context = createContext({} as Switcher)

export const useSwitcher = () => useContext(context)

const reducer = createReducer<Switcher>({
    FOO: {
        SWITCH: (): Transition => ({ state: 'BAR' })
    },
    BAR: {
        SWITCH: (): Transition => ({ state: 'FOO' })
    }
})

export const SwitcherProvider: React.FC<SwitcherProviderProps> = ({
    children,
    initialState = { state: 'FOO' }
}) => {
    const value = useReducer(reducer, initialState)

    return (
        <context.Provider value={value}>
            {children}
        </context.Provider>
    )
}
```

## Public Provider

Keep certain actions private to the provider component. Any consuming component only has public actions typed.

```tsx
import { createContext, useReducer } from 'react'
import { States, StateTransition, createReducer } from 'react-states'

type State = {
    state: 'FOO'
} | {
    state: 'BAR'
}

type Action = {
    type: 'SWITCH'
}

type PrivateAction = {
    type: 'PRIVATE_SWITCH'
}

// The switcher takes both action types
type Switcher = States<State, Action | PrivateAction>

// Though the public one takes only public actions
export type PublicSwitcher = States<State, Action>

type Transition = StateTransition<Switcher>

// Type the provided reducer as public
const context = createContext({} as PublicSwitcher)

const reducer = createReducer<Switcher>({})
```