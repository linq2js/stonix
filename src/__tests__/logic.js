import stonix from "../index";

const CounterLogic = {
  state: {
    count: 1,
    logs: [],
    odds: 0,
  },
  increase: {
    count: (state) => state + 1,
  },
  decrease: {
    count: (state) => state - 1,
  },
  "*": {
    logs: (state, args) => {
      return state.concat(args);
    },
  },
  updateEven: {
    odds: (state, { payload }) => payload,
  },
  // effects
  increaseAsync(payload, { call }) {
    call("increase");
  },
  flow: [updateEvenSaga],
};

function updateEvenSaga({ when, call, get }) {
  return when(
    "increase",
    call(({ payload }) => {
      if (payload % 2 === 0) {
        return call("updateEven", get().odds + 1);
      }
    })
  );
}

test("store.call(action, payload)", () => {
  const store = stonix()
    .use(CounterLogic)

    .use({
      state: {
        // skip update count state because it is already exists in before logic
        count: 2,
        // data state should be evaluated when applying logic
        data: () => true,
      },
    });
  store.increase(1);
  expect(store.get().count).toBe(2);
  store.decrease(2);
  expect(store.get().count).toBe(1);
  store.call("increase", 3);
  store.call("increase", 4);
  expect(store.get().count).toBe(3);
  expect(store.get().logs).toEqual([
    { action: "increase", payload: 1 },
    { action: "decrease", payload: 2 },
    { action: "increase", payload: 3 },
    { action: "increase", payload: 4 },
    { action: "updateEven", payload: 1 },
  ]);
  expect(store.get().odds).toBe(1);
  expect(store.get().data).toBe(true);
  // try to call effect
  store.increaseAsync();
  expect(store.get().count).toBe(4);
});

test("handle store events", () => {
  const changeCallback = jest.fn();
  const callCallback = jest.fn();
  const store = stonix({
    state: {
      count: 0,
    },
    increase: { count: (state) => state + 1 },
    on: {
      change: changeCallback,
      call: callCallback,
    },
  });

  store.call("increase");
  store.call("increase");
  store.call("test");

  expect(changeCallback).toBeCalledTimes(2);
  expect(callCallback).toBeCalledTimes(3);
});
