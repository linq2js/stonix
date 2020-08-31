export const flowType = "@@flow";
export const loadable = "@@loadable";
export const noop = () => {};
export const unset = {};
export const cancellableType = "@@cancellable";
export const privateAction = () => {
  throw new Error("Cannot dispatch private action");
};
