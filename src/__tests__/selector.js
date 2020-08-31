import stonix from "../index";

test("simple selector", () => {
  const store = stonix({
    state: {
      count: 1,
    },
    select: {
      count: (state) => state.count,
    },
    increase: {
      count: (state) => state + 1,
    },
  });

  expect(store.select("count")).toBe(1);
  store.increase();
  expect(store.select("count")).toBe(2);
});

test("selector dependency", () => {
  const store = stonix({
    state: {
      count: 1,
    },
    select: {
      count: (state) => state.count,
      doubleCount: ["count", (count) => count * 2],
    },
    increase: {
      count: (state) => state + 1,
    },
  });

  expect(store.select("count")).toBe(1);
  expect(store.select("doubleCount")).toBe(2);
  store.increase();
  expect(store.select("count")).toBe(2);
  expect(store.select("doubleCount")).toBe(4);

  // with custom state
  expect(store.select("doubleCount", { count: 4 })).toBe(8);
});
