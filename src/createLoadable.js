import { loadable } from "./types";

export default function createLoadable(action, state, value, promise, error) {
  return {
    _value: value,
    type: loadable,
    state,
    action,
    get value() {
      if (state === "loading") throw promise;
      if (state === "hasError") throw error;
      return value;
    },
    tryGetValue(defaultValue) {
      if (typeof value === "undefined") return defaultValue;
      return value;
    },
    promise,
    error
  };
}
