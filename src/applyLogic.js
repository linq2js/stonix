import {
  createReducerFromAction,
  createReducerFromProp,
} from "./createReducer";
import createActionMatcher from "./createActionMatcher";
import { noop, flowType } from "./types";
import * as asyncModule from "./asyncModule";
import * as flowModule from "./flowModule";

export default function applyLogic(
  context,
  { state = {}, flow = noop, select, on: listeners, init, ...actions } = {}
) {
  const {
    api,
    on,
    data,
    mergeState,
    addReducers,
    addSelector,
    addDispatchers,
    onChange,
    onDispatch,
  } = context;

  if (init && typeof init !== "function") {
    throw new Error("init effect must be function");
  }

  const effectApi = { ...asyncModule, ...api };
  const flowApi = { ...flowModule, get: api.get };
  Object.entries(actions).forEach(([key, action]) => {
    // is prop reducer  { #prop: func }
    if (key[0] === "@") {
      addReducers(createReducerFromProp(context, key.substr(1), action));
      return;
    }
    const matcher = createActionMatcher(key);
    addDispatchers(matcher);
    if (typeof action !== "function") {
      addReducers(createReducerFromAction(context, key, action));
      return;
    }

    // effect
    on(matcher, (args) =>
      action(args.payload, { data, ...args, ...effectApi })
    );
  });
  mergeState(typeof state === "function" ? state() : state);
  const flows = [];
  collectFlowList(flows, flowApi, flow);
  if (listeners) {
    listeners.change && onChange(listeners.change);
    listeners.call && onDispatch(listeners.call);
  }
  if (select) {
    Object.entries(select).forEach(([key, value]) => addSelector(key, value));
  }
  init && init({ data, action: "init", store: api, ...effectApi });
  const flowArgs = [api.get(), { dispatch: api.call, subscribe: on }];
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
