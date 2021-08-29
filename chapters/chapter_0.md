# A third primitive

There are two primitives in React to manage state. **useState** and **useReducer**. In this book we will discuss the need for a third state management primitive, **useStates**.

To understand why we may consider a third primitive, we have to understand why we have the two current primitives and what their limitations are. It will also help discussing the difference between these two primitives, to better understand why a third one can benefit us.

To be as precise as possible in this discussion we will use a simple number as state.

```typescript
const [value, setValue] = useState(0)
```

In this example the number has no conceptual meaning, it is just a number. We can change it to whatever we want and there is really no reason to use any more complex primitives to manage this piece of state.

But often you want to add constraints to how this value can change. An example of this would be if the number represents a count which can only increment and decrement by one. Trying to represent this with **useState** reveals its limitation.

```typescript
const [count, setCount] = useState(0)
```

It can only hold on to a value, **setCount** allows you to set any value.

To enforce this constraint you can move to a **useReducer**. 

```typescript
const [count, dispatch] = useReducer((state, action) => {
  switch (action.type) {
    case 'INCREMENT': return state + 1
    case 'DECREMENT': return state - 1
  }
  return state
}, 0)
```

React is a functional world and you could imagine in an object oriented world that we would move to a class to create the same constraint.

```typescript
class Count {
  private _value = 0
  get value() {
    return this._value
  }
  increment() {
    this._value += 1
  }
  decrement() {
    this._value -= 1
  }
}
```
