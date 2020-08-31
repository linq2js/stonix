import stonix from "../index";

test("simple middleware", () => {
  const callback = jest.fn();
  // noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
  const store = stonix(
    {},
    {
      middleware: (store) => (next) => (action, payload) => {
        callback(action, payload);
        return next(action, payload);
      },
    }
  );
  store.call("test", 1);
  store.call("test", 2);
  store.call("test", 3);
  expect(callback.mock.calls).toEqual([
    ["test", 1],
    ["test", 2],
    ["test", 3],
  ]);
});
