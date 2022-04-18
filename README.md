# react-states

> Explicit states for predictable user experiences

## Install

```sh
npm install react-states@next
```

## Explaining explicit states

[![react-states](https://img.youtube.com/vi/ul_3ABrpj64/0.jpg)](https://www.youtube.com/watch?v=ul_3ABrpj64)

## Examples

- [Resizer in the Devtools](./src/devtools//Resizer.tsx)
- [FamilyScrum](https://github.com/christianalfoni/family-scrum-v2/tree/main/src)

## What react-states offers

### Explicit States Reducer (Core)

- You are explicit about what states the reducer can be in
- You avoid `undefined` and `null` checking
- All state changes and effects are guarded
- Everything is a dispatch, no callbacks
- As a provider you can just expose the reducer, ensuring optimal reconciliation
- The `match` utility is exhaustive, meaning any change to your state in risk of breaking the UI will become a type error

### Environment Interface (Optional)

- You avoid environment specific APIs and "magical strings" in your application code
- The interface your application consumes is perfectly tailored for the application
- Your application is environment agnostic, just add more implementations of the interface (test, ssr, native, sandbox) and it works the same

### Environment Events (Optional)

- You avoid situations where promises resolve after component unmount
- Promise catch is not typed, but events are
- No more async tests, events can be simulated and fired synchronously

## Documentation

- [API](./docs/api.md)
- [Patterns](./docs/patterns.md)
