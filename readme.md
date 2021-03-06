# stonix

Zero-configuration store for React. One API rule them all.

## Basic Example

The whole state of your app is stored in an object tree inside a single store. The only way to change the state tree is to emit an action, an object describing what happened. To specify how the actions transform the state tree, you write pure reducers.

That's it!

```jsx harmony
import stonix from "stonix";

const storeLogic = {
  // default value for count state
  state: {
    count: 0,
  },
  "@count": {
    increase: (value) => value + 1,
    decrease: (value) => value - 1,
  },
};

// Create a store holding the your app state and logic.
// Its API is { on, call, get, ... autoGeneratedActionDispatchers }.
const store = stonix(storeLogic);
store.on(() => console.log(store.get()));
// The only way to mutate the internal state is to dispatch an action.
// increase is auto generated action dispatcher
store.increase();
// 1
store.increase();
// 2
store.increase();
// 3
// store.increase equivalence to store.call('increase')
```

Alternative store logic

```jsx harmony
const storeLogic = {
  // default value for count state
  state: {
    count: 0,
  },
  // action listeners
  // increase action
  increase: {
    // name of state to mutate
    count: (value) => value + 1,
  },
  // decrease action
  decrease: { count: (value) => value - 1 },
};
```

## Structure of store logic

A store logic is plain of object following structure below

```jsx harmony
const storeLogic = {
  // indicate default value of store state
  state: {
    count: 1,
    todos: [],
  },
  // define init effect, this effect will be called when the logic applied to store
  init() {},
  // define reducer of count state, this reducer will be called whenver any action called
  "@count"(value, { action, payload, /* store state */ state }) {
    return value;
  },
  // define increase reducer, this reducer will be called whenever increase action called
  increase: {
    // increase reducer mutates count state only
    count: (value) => value + 1,
    // can define more mutationss here
  },
  // increaseAsync is an effect, can handle asynchronous flow inside effect
  // the effect works like redux-thunk but it is easier to use
  async increaseAsync(payload, { call, delay, get }) {
    // access count state
    console.log(get().count);
    // delay is util func that returns a promise
    await delay(1000);
    // call increase action
    call("increase");
  },
  // can use wildcard * in effect name pattern, this means the effect will be called whenerver any action called
  "*"(payload, { action }) {
    console.log(action, payload);
  },
  // we can use wildcard for reducer or effect name pattern
  // this effect will be called whenever increase or decrease action called
  "increase|decrease"() {},
  // starts with wildcard
  "load_*"() {},
  // ends with wildcard
  "*_success"() {},
};
```
