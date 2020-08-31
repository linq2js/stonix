import { loadable } from "./types";

const defaultReducer = (state) => state;

export default function createLoadableReducer(...settings) {
  let hasProp = false;
  const props = {};
  settings.forEach(
    ({ prop: forProp = "", action: forAction, outdated, result }) => {
      if (forProp) {
        hasProp = true;
      }
      const reducer = (state, args) => {
        const { payload } = args;
        if (!payload || payload.type !== loadable) return state;
        if (forAction && forAction !== payload.action) return state;
        if (typeof outdated !== "undefined" && outdated !== payload.outdated)
          return state;
        if (typeof result === "function") return result(payload, state, args);
        return payload[result];
      };

      const prev = props[forProp];
      if (prev) {
        props[forProp] = (state, args) => reducer(prev(state, args), args);
      } else {
        props[forProp] = reducer;
      }
    }
  );
  if (hasProp) return props;
  return props[""] || defaultReducer;
}
