import createStore from "./createStore";
import createLoadable from "./createLoadable";
import createLoadableReducer from "./createLoadableReducer";

export default function stonix() {
  return createStore(...arguments);
}

Object.assign(stonix, {
  loadable(defaultValue) {
    return createLoadable(undefined, "hasValue", defaultValue);
  }
});

Object.assign(stonix.loadable, {
  reducer: createLoadableReducer
});
