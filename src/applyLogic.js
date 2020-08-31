import {
  createReducerFromAction,
  createReducerFromProp,
} from "./createReducer";
import createActionMatcher from "./createActionMatcher";
import { noop, privateAction, flowType } from "./types";
import * as asyncModule from "./asyncModule";
import * as flowModule from "./flowModule";

export default function applyLogic(
  { store, data, mergeState, addSelector, reducers, onChange, onDispatch },
  { state = {}, flow = noop, select, on, init, ...actions } = {}
) {
  if (init && typeof init !== "function") {
    throw new Error("init effect must be function");
  }

  const effectApi = { ...asyncModule, call: store.call, get: store.get };
  const flowApi = { ...flowModule, get: store.get };
  Object.entries(actions).forEach(([key, action]) => {
    // is prop reducer  { #prop: func }
    if (key[0] === "@") {
      reducers.push(createReducerFromProp(key.substr(1), action));
      return;
    }
    const matcher = createActionMatcher(key);
    createDispatchers(store, matcher);
    if (typeof action !== "function") {
      reducers.push(createReducerFromAction(key, action));
      return;
    }

    // effect
    store.on(matcher, (args) =>
      action(args.payload, { data, ...args, ...effectApi })
    );
  });
  mergeState(typeof state === "function" ? state() : state);
  const flows = [];
  collectFlowList(flows, flowApi, flow);
  if (on) {
    on.change && onChange(on.change);
    on.call && onDispatch(on.call);
  }
  if (select) {
    Object.entries(select).forEach(([key, value]) => addSelector(key, value));
  }
  init && init({ data, action: "init", store, ...effectApi });
  const flowArgs = [store.get(), { dispatch: store.call, subscribe: store.on }];
  flows.forEach((x) => x(...flowArgs));
}

function collectFlowList(list, api, flow) {
  if (!flow) return;
  if (Array.isArray(flow))
    return flow.forEach((item) => collectFlowList(list, api, item));
  if (typeof flow !== "function") throw new Error("Invalid flow");
  if (flow.type === flowType) {
    list.push(flow);
    return;
  }
  return collectFlowList(list, api, flow(api));
}

function createDispatchers(store, matcher) {
  if (!matcher.actionType && !matcher.actionTypeList) return;
  const actionTypes = matcher.actionTypeList || [matcher.actionType];
  // create multiple action dispatchers
  actionTypes.forEach((actionType) => {
    if (actionType[0] !== "_") {
      store[matcher.actionType] = (payload) => store.call(actionType, payload);
    } else {
      store[actionType] = privateAction;
    }
  });
}
