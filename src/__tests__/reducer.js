import stonix from "../index";

test("action reducer: any *", () => {
  const callback = jest.fn();
  const store = stonix({
    "*": callback,
  });

  store.call("test");
  store.call("test");
  expect(callback).toBeCalledTimes(2);
});

test("action reducer: starts with", () => {
  const callback = jest.fn();
  const store = stonix({
    "*.success": callback,
  });

  store.call("test");
  store.call("test");
  store.call("load.success");
  expect(callback).toBeCalledTimes(1);
});

test("action reducer: ends with", () => {
  const callback = jest.fn();
  const store = stonix({
    "load.*": callback,
  });

  store.call("test");
  store.call("test");
  store.call("load.success");
  expect(callback).toBeCalledTimes(1);
});

test("action reducer: or", () => {
  const callback = jest.fn();
  const store = stonix({
    "action1|action2": callback,
  });

  store.call("action1");
  store.call("action2");
  store.call("action3");
  expect(callback).toBeCalledTimes(2);
});

test("prop reducer: *", () => {
  const store = stonix({
    state: {
      count: 0,
    },
    "@count"(state, { action }) {
      if (action === "increase") return state + 1;
      if (action === "decrease") return state - 1;
      return state;
    },
  });
  store.call("increase");
  expect(store.get().count).toBe(1);
  store.call("decrease");
  expect(store.get().count).toBe(0);
});

test("prop reducer: specific action", () => {
  const store = stonix({
    state: {
      count: 0,
    },
    "@count": {
      increase: (state) => state + 1,
      decrease: (state) => state - 1,
    },
  });
  store.call("increase");
  expect(store.get().count).toBe(1);
  store.decrease();
  expect(store.get().count).toBe(0);
});
