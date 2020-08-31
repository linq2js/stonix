import createActionMatcher from "./createActionMatcher";

export function createReducerFromAction(
  context,
  action,
  { $, "*": defaultReducer, $mutate, ...reducers }
) {
  const matcher = createActionMatcher(action);
  const entries = Object.entries(reducers);
  return (
    defaultReducer ||
    function (currentState, args) {
      const { action, payload } = args;
      if (!matcher(action)) return currentState;
      const mappedArgs = {
        action,
        payload: $ ? $(currentState, args) : payload,
      };
      let nextState = currentState;

      entries.forEach(([key, reducer]) => {
        const currentValue = nextState[key];
        const nextValue =
          typeof reducer === "function"
            ? reducer(currentValue, mappedArgs)
            : reducer;

        if (nextValue !== currentValue) {
          if (nextState === currentState) {
            nextState = { ...currentState };
          }
          nextState[key] = nextValue;
        }
      });
      return nextState;
    }
  );
}

export function createReducerFromProp(context, prop, reducers) {
  const entries =
    typeof reducers === "function"
      ? [[createActionMatcher("*"), reducers]]
      : Object.entries(reducers).map(([key, reducer]) => {
          const matcher = createActionMatcher(key);
          context.addDispatchers(matcher);
          return [matcher, reducer];
        });

  return function (state, args) {
    const { action } = args;
    const currentValue = state[prop];
    const nextValue = entries.reduce(
      (value, [matcher, reducer]) =>
        matcher(action) ? reducer(value, args) : value,
      currentValue
    );
    if (currentValue !== nextValue) return { ...state, [prop]: nextValue };
    return state;
  };
}
