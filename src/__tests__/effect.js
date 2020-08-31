import stonix from "../index";
import { delay } from "../asyncModule";

test("effect should be called properly", async () => {
  const store = stonix({
    increase: {
      count: (state = 0, { payload = 1 }) => state + payload,
    },
    async increaseAsync(payload, { delay, call }) {
      await delay(10);
      call("increase", payload);
    },
  });

  store.increaseAsync(2);
  await delay(15);
  expect(store.get().count).toBe(2);
});
