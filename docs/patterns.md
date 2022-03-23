# Patterns

- [Provider](#Provider)
- [Public Provider](#Public-Provider)
- [Dynamic reducer](#Dynamic-reducer)
- [Lift handlers](#Lift-handlers)
- [Shared commands](#Shared-commands)
    
## Provider

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

type Switcher = States<State, Action | PrivateAction>

type Transition = StateTransition<Switcher>

export type PublicSwitcher = States<State, Action>

const context = createContext({} as PublicSwitcher)

const reducer = createReducer<Switcher>({})
```