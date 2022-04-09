# react-states

> Explicit states for predictable user experiences

## Install

```sh
npm install react-states@next
```

## What react-states offers

### Explicit States

- You are explicit about what states the reducer can be in
- You avoid `undefined` and `null` checking
- All state changes and effects are guarded
- Everything is a dispatch, no callbacks
- As a provider you can just expose the reducer, ensuring optimal reconciliation
- The `match` utility is exhaustive, meaning any change to your state in risk of breaking the UI will become a type error

### Environment Interface

- You avoid environment specific APIs in your application code
- You avoid magical strings
- The interface your application consumes is perfectly tailored for the application
- Your application is environment agnostic, just add more implementations of the interface (test, ssr, native) and it works the same

### Environment Events

- You avoid situations where promises resolve after component unmount
- Promise catch is not typed, but events are
- No more async tests, events can be simulated and fired synchronously

## Documentation

- [Example](./docs/example.md)
- [API](./docs/api.md)
- [Patterns](./docs/patterns.md)
- [Testing](./docs/testing.md)
