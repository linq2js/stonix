import createEmitter from "./createEmitter";
import createActionMatcher from "./createActionMatcher";
import applyMiddleware from "./applyMiddleware";
import applyLogic from "./applyLogic";
import createSelector from "./createSelector";
import { privateAction } from "./types";
import storeHook from "./useStore";
import isPromiseLike from "./isPromiseLike";
import createLoadable from "./createLoadable";

const defaultAsyncActionTypes = {
  loading: "async.loading",
  success: "async.success",
  error: "async.error",
  done: "async.done",
};

export default function createStore(
  logic,
  { middleware = [], asyncMode = "default" } = {}
) {
  const emitter = createEmitter();
  const selectorMap = {};
  const selectorWrapperMap = {};
  const reducers = [];
  const onChange = emitter.get("change").on;
  const onDispatch = emitter.get("dispatch").on;
  const asyncModeMatchers = asyncMode
    ? Object.entries(
        typeof asyncMode === "object"
          ? asyncMode
          : asyncMode === "dynamic"
          ? { "*": "dynamic" }
          : { "*": "default" }
      ).map((entry) => [createActionMatcher(entry[0]), entry[1]])
    : [];
  // where to store temp data
  const data = {};
  let currentState = {};
  const api = applyMiddleware(
    {
      call,
      get,
    },
    Array.isArray(middleware) ? middleware : middleware ? [middleware] : []
  );
  const storeHookContext = {
    getState: api.get,
    onChange,
    selectorMap: selectorWrapperMap,
  };
  const store = {
    ...api,
    use,
    select,
    on,
  };
  const logicContext = {
    api,
    data,
    on,
    mergeState,
    onChange,
    onDispatch,
    addSelector,
    addReducers,
    addDispatchers,
  };

  function get() {
    if (arguments.length) return currentState[arguments[0]];
    return currentState;
  }

  function call(action, payload) {
    // auto process promise
    if (isPromiseLike(payload)) {
      const promise = payload;
      const dataKey = `${action}.promise`;
      data[dataKey] = promise;

      const [, asyncModeEntry] =
        asyncModeMatchers.find(([matcher]) => matcher(action)) || [];

      if (asyncModeEntry) {
        let asyncActionTypes;
        if (
          asyncModeEntry === "dynamic" ||
          typeof asyncModeEntry === "object"
        ) {
          asyncActionTypes = {
            loading: `${action}.loading`,
            success: `${action}.success`,
            error: `${action}.error`,
            done: `${action}.done`,
          };

          if (typeof asyncModeEntry === "object") {
            Object.assign(asyncActionTypes, asyncModeEntry);
          }
        } else {
          asyncActionTypes = defaultAsyncActionTypes;
        }

        const { loading, success, error, done } = asyncActionTypes;

        loading &&
          api.call(
            loading,
            createLoadable(action, "loading", undefined, promise)
          );
        promise.then(
          (result) => {
            const loadable = createLoadable(
              action,
              "hasValue",
              result,
              promise
            );
            loadable.outdated = data[dataKey] && data[dataKey] !== promise;
            success && api.call(success, loadable);
            api.call(action, result);
            done && api.call(done, loadable);
          },
          (e) => {
            const loadable = createLoadable(
              action,
              "hasValue",
              undefined,
              promise,
              e
            );
            loadable.outdated = data[dataKey] && data[dataKey] !== promise;
            error && api.call(error, loadable);
            done && api.call(done, loadable);
          }
        );
        return;
      }
    }

    // call reducer
    const reducerArgs = { action, payload, state: currentState };
    const nextState = reducers.reduce(
      (state, reducer) => reducer(state, reducerArgs),
      currentState
    );
    setState(nextState);
    const dispatchArgs = { action, payload, store };
    emitter.emit("dispatch", dispatchArgs);
    emitter.emit("@" + action, dispatchArgs);
  }

  function setState(nextState) {
    if (nextState !== currentState) {
      currentState = nextState;
      // notify change
      emitter.emit("change", { store, state: currentState });
    }
  }

  function on() {
    if (arguments.length < 2) {
      return emitter.on("dispatch", arguments[0]);
    }
    const [action, listener] = arguments;
    const matcher =
      typeof action === "function" ? action : createActionMatcher(action);
    if (matcher.actionType || matcher.actionTypeList) {
      const removeListeners = (
        matcher.actionTypeList || [matcher.actionType]
      ).map((actionType) => emitter.on("@" + actionType, listener));
      return () => {
        while (removeListeners.length) {
          const removeListener = removeListeners.pop();
          removeListener();
        }
      };
    }

    return emitter.on(
      "dispatch",
      (args) => matcher(args.action) && listener(args)
    );
  }

  function mergeState(state) {
    if (typeof state === "function") {
      state = state(currentState);
    }
    let nextState = currentState;
    Object.entries(state).forEach(([key, value]) => {
      if (key in nextState) return;
      if (nextState === currentState) {
        nextState = { ...nextState };
      }
      nextState[key] = typeof value === "function" ? value() : value;
    });
    setState(nextState);
  }

  function addDispatchers(...matchers) {
    matchers.forEach((matcher) => {
      if (!matcher.actionType && !matcher.actionTypeList) return;
      const actionTypes = matcher.actionTypeList || [matcher.actionType];
      // create multiple action dispatchers
      actionTypes.forEach((actionType) => {
        if (actionType in store) return;
        if (actionType[0] !== "_") {
          store[matcher.actionType] = (payload) =>
            api.call(actionType, payload);
        } else {
          store[actionType] = privateAction;
        }
      });
    });
  }

  function addReducers() {
    reducers.push(...arguments);
  }

  function addSelector(key, definition) {
    const isExist = key in selectorMap;
    selectorMap[key] = createSelector(definition, selectorMap);
    if (isExist) return;
    Object.defineProperty(selectorWrapperMap, key, {
      get() {
        return selectorMap[key](currentState);
      },
    });
  }

  function select(selector) {
    if (typeof selector === "string") {
      const s = selectorMap[selector];
      if (!s) throw new Error(`No selector named ${selector} found`);
      if (arguments.length > 1) return s(arguments[1]);
      return s(currentState);
    }
    return storeHook(storeHookContext, selector);
  }

  function use(logic) {
    applyLogic(logicContext, logic);
    return store;
  }

  logic && (Array.isArray(logic) ? logic : [logic]).forEach(use);

  return store;
}
