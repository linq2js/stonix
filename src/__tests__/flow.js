import { when, delay, call, pipe, latest, debounce } from "../flowModule";
import createEmitter from "../createEmitter";

const delayPromise = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("all", async () => {
  const callback = jest.fn();
  when([delay(5, 1), delay(5, 2), delay(5, 3)])(undefined, {
    onDone: callback,
  });
  await delayPromise(10);
  expect(callback).toBeCalledWith([1, 2, 3]);
});

test("race", async () => {
  const callback = jest.fn();
  when({ prop1: delay(5, 1), prop2: delay(5, 2), prop3: delay(1, 3) })(
    undefined,
    {
      onDone: callback,
    }
  );
  await delayPromise(10);
  expect(callback).toBeCalledWith({
    prop3: { type: expect.anything(), payload: 3 },
  });
});

test("race with call", async () => {
  function search(ms) {
    return new Promise((resolve) => {
      when({
        timeout: delay(10),
        loaded: call(async () => {
          await delayPromise(ms);
          return "test";
        }),
      })(undefined, { onDone: resolve });
    });
  }

  const r1 = await search(20);
  expect(r1).toEqual({
    timeout: { type: expect.anything(), payload: undefined },
  });

  const r2 = await search(5);
  expect(r2).toEqual({ loaded: { type: expect.anything(), payload: "test" } });
});

test("parallel", async () => {
  const callback1 = jest.fn();
  const callback2 = jest.fn();
  const callback3 = jest.fn();
  const callback4 = jest.fn();

  call([
    pipe([delay(5, 1), call(callback1)]),
    pipe([delay(5, 2), call(callback2)]),
    pipe([delay(5, 3), call(callback3)]),
  ])(undefined, { onDone: callback4 });

  expect(callback4).toBeCalledTimes(1);

  await delayPromise(10);

  expect(callback1).toBeCalled();
  expect(callback2).toBeCalled();
  expect(callback3).toBeCalled();
});

test("every", () => {
  const emitter = createEmitter();
  const callback = jest.fn();

  when("click", call(callback))(undefined, {
    subscribe: emitter.get("dispatch").on,
  });

  emitter.emit("dispatch", { action: "click" });
  emitter.emit("dispatch", { action: "click" });
  emitter.emit("dispatch", { action: "click" });

  expect(callback).toBeCalledTimes(3);
});

test("latest", async () => {
  const emitter = createEmitter();
  const callback = jest.fn();

  when("click", latest(pipe([delay(5), call(callback)])))(undefined, {
    subscribe: emitter.get("dispatch").on,
  });

  emitter.emit("dispatch", { action: "click" });
  emitter.emit("dispatch", { action: "click" });
  emitter.emit("dispatch", { action: "click" });
  await delayPromise(10);
  expect(callback).toBeCalledTimes(1);
});

test("debounce", async () => {
  const emitter = createEmitter();
  const callback = jest.fn();

  when("click", latest(debounce(5, callback)))(undefined, {
    subscribe: emitter.get("dispatch").on,
  });

  emitter.emit("dispatch", { action: "click" });
  emitter.emit("dispatch", { action: "click" });
  emitter.emit("dispatch", { action: "click" });
  await delayPromise(10);
  expect(callback).toBeCalledTimes(1);
});

test("promise", async () => {
  const callback = jest.fn();
  const search = (promise) =>
    when(promise, {
      onSuccess: call(callback, (payload) => ({ payload, type: "success" })),
      onError: call(callback, (payload) => ({ payload, type: "error" })),
      onDone: call(callback, () => ({ type: "done" })),
    })();

  search(Promise.resolve(true));
  await delayPromise(0);
  expect(callback.mock.calls).toEqual([
    [{ payload: true, type: "success" }],
    [{ type: "done" }],
  ]);
  search(Promise.reject(false));
  await delayPromise(0);
  expect(callback.mock.calls).toEqual([
    [{ payload: true, type: "success" }],
    [{ type: "done" }],
    [{ payload: false, type: "error" }],
    [{ type: "done" }],
  ]);
});

test("konami code", () => {
  const callback = jest.fn();
  const emitter = createEmitter();
  const listenKonamiCode = () =>
    when(
      "up>up>down>down>left>right>left>right>B>A>B>A",
      call(callback)
    )(undefined, { subscribe: emitter.get("dispatch").on });

  listenKonamiCode();

  emitter.emit("dispatch", { action: "up" });
  emitter.emit("dispatch", { action: "up" });
  emitter.emit("dispatch", { action: "down" });
  emitter.emit("dispatch", { action: "down" });
  emitter.emit("dispatch", { action: "left" });
  emitter.emit("dispatch", { action: "right" });
  emitter.emit("dispatch", { action: "left" });
  emitter.emit("dispatch", { action: "right" });
  emitter.emit("dispatch", { action: "B" });
  emitter.emit("dispatch", { action: "A" });
  emitter.emit("dispatch", { action: "B" });
  emitter.emit("dispatch", { action: "A" });

  expect(callback).toBeCalledTimes(1);

  emitter.emit("dispatch", { action: "up" });
  emitter.emit("dispatch", { action: "up" });
  emitter.emit("dispatch", { action: "down" });
  emitter.emit("dispatch", { action: "down" });
  emitter.emit("dispatch", { action: "left" });
  emitter.emit("dispatch", { action: "right" });
  emitter.emit("dispatch", { action: "left" });
  emitter.emit("dispatch", { action: "right" });
  emitter.emit("dispatch", { action: "B" });
  emitter.emit("dispatch", { action: "A" });
  emitter.emit("dispatch", { action: "B" });
  emitter.emit("dispatch", { action: "A" });

  expect(callback).toBeCalledTimes(2);
});
