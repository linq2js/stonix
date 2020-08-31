import { flowType, cancellableType, noop } from "./types";
import createCancellable from "./createCancellable";
import isPromiseLike from "./isPromiseLike";
import createActionMatcher from "./createActionMatcher";

export function delay(ms, value) {
  return Object.assign(
    function delay$(prev = value, { onDone } = {}) {
      const cancellable = createCancellable();
      const timerId = setTimeout(() => {
        if (cancellable.cancelled()) return;
        cancellable.dispose();

        onDone && onDone(prev);
      }, ms);
      cancellable.onDispose(() => clearTimeout(timerId));
      return cancellable;
    },
    {
      type: flowType
    }
  );
}

export function when(input, callback = {}) {
  return Object.assign(
    function when$(prev, options = {}) {
      const {
        onDone = noop,
        subscribe,
        cancellable: parentCancellable
      } = options;
      const cancellable = createCancellable();
      if (parentCancellable) parentCancellable.onCancel(cancellable.cancel);

      let value = input;
      let isMultiple = false;
      let isAsyncRace = false;
      let entries = [];

      if (typeof value === "function") {
        value = value(prev, {
          ...options,
          cancellable,
          onDone(result) {
            cancellable.dispose();
            onDone && onDone(result);
          }
        });
      }

      if (value && value.type !== cancellableType) {
        if (typeof value === "string" || isPromiseLike(value)) {
          entries = [[0, value]];
        } else if (Array.isArray(value)) {
          entries = Object.entries(value);
          isMultiple = true;
        } else if (typeof value === "object") {
          isMultiple = true;
          isAsyncRace = true;
          entries = Object.entries(value);
        } else {
          throw new Error("Invalid when input");
        }
      }

      const results = isAsyncRace ? {} : [];
      const cancels = [];
      let doneTotal = isAsyncRace ? 1 : entries.length;
      let doneCount = 0;
      let done = false;

      function cancelOthers(index) {
        cancels.forEach((cancel, i) => {
          if (index === i || !cancel) {
            return;
          }
          cancel();
        });
      }

      function handleSuccess(key, index, type, payload, action) {
        if (done) return;
        if (cancellable.cancelled()) return;
        doneCount++;
        const result = isAsyncRace ? { type, payload } : payload;
        if (typeof callback === "function") {
          if (callback.type === flowType) {
            callback(
              { action, payload },
              {
                ...options,
                cancellable
              }
            );
          } else {
            callback({ action, payload });
          }
          if (!isAsyncRace) return;
        }

        if (doneCount >= doneTotal) {
          done = true;
          if (isAsyncRace) cancelOthers(index);
          cancellable.dispose();
        }

        callback.onSuccess &&
          call(callback.onSuccess)(result, {
            ...options,
            cancellable
          });

        if (isMultiple) {
          results[key] = result;
          onDone(results);
        } else {
          onDone(payload);
        }

        handleDone();
      }

      function handleDone() {
        callback.onDone &&
          call(callback.onDone)(undefined, {
            ...options,
            subscribe,
            cancellable
          });
      }

      function handleError(error) {
        if (cancellable.cancelled()) return;
        callback.onError &&
          call(callback.onError)(error, { ...options, cancellable });
        handleDone();
      }

      entries.forEach(([key, propValue], index) => {
        const type = propValue;
        if (done) return;
        if (typeof propValue === "function") {
          propValue = propValue(prev, {
            ...options,
            cancellable,
            onDone(payload) {
              handleSuccess(key, index, type, payload);
            }
          });

          if (propValue && propValue.type === cancellableType) {
            cancels[index] = propValue.cancel;
            return;
          }
        }

        if (typeof propValue === "string") {
          const matcher = createActionMatcher(propValue);
          const unsubscribe = subscribe(({ action, payload }) => {
            matcher(action) && handleSuccess(key, index, type, payload, action);
          });
          cancellable.onDispose(unsubscribe);
        } else if (isPromiseLike(propValue)) {
          callback.onLoading &&
            call(callback.onLoading)(propValue, { ...options, cancellable });

          propValue.then(
            (payload) => handleSuccess(key, index, type, payload),
            handleError
          );
        }
      });

      return cancellable;
    },
    {
      type: flowType
    }
  );
}

export function pipe(ops) {
  return Object.assign(
    function pipe$(
      prev,
      { onDone = noop, cancellable: parentCancellable, ...options } = {}
    ) {
      let index = -1;
      const cancellale = createCancellable();

      if (parentCancellable) parentCancellable.onCancel(cancellale.cancel);

      function next(value) {
        if (cancellale.cancelled()) return;

        index++;
        // end of op list
        if (index >= ops.length) {
          return onDone(value);
        }

        const op = ops[index];
        if (op.type === flowType) {
          op(value, { ...options, onDone: next });
        } else {
          // notmal function
          call(op)(value, { onDone: next, cancellale });
        }
      }

      next(prev);

      return cancellale;
    },
    {
      type: flowType
    }
  );
}

export function call(fn, payloadResolver) {
  const hasPayloadResolver = arguments.length > 1;
  if (Array.isArray(fn)) return parallel(fn);

  return Object.assign(
    function call$(payload, options = {}) {
      payload = hasPayloadResolver
        ? typeof payloadResolver === "function"
          ? payloadResolver(payload)
          : payloadResolver
        : payload;

      if (fn.type === flowType) return fn(payload, options);

      const {
        onDone = noop,
        dispatch = noop,
        cancellable: parentCancellable
      } = options;
      const cancellable = createCancellable();

      if (parentCancellable) parentCancellable.onCancel(cancellable.cancel);

      const result =
        typeof fn === "string" ? dispatch(fn, payload) : fn(payload);
      if (isPromiseLike(result)) {
        result.then((asyncResult) => {
          if (cancellable.cancelled()) return;
          onDone(asyncResult);
        });
      } else if (result && result.type === flowType) {
        result(payload, { ...options, cancellable });
      } else {
        onDone(result);
      }

      return cancellable;
    },
    {
      type: flowType
    }
  );
}

function parallel(ops) {
  return Object.assign(
    function parallel$(payload, { onDone = noop, ...options } = {}) {
      ops.forEach((op) => {
        call(op)(payload, options);
      });
      onDone(payload);
    },
    {
      type: flowType
    }
  );
}

export function latest(fn) {
  let cancellable;
  return Object.assign(
    function latest$(payload, options = {}) {
      if (cancellable) cancellable.cancel();

      cancellable = createCancellable();
      if (options.cancellable) options.cancellable.onCancel(cancellable.cancel);

      call(fn)(payload, {
        ...options,
        cancellable
      });

      return cancellable;
    },
    {
      type: flowType
    }
  );
}

export function debounce(ms, fn) {
  let cancellable;
  return Object.assign(
    function debounce$(payload, options = {}) {
      if (cancellable) cancellable.cancel();
      cancellable = createCancellable();
      if (options.cancellable) options.cancellable.onCancel(cancellable.cancel);

      const timerId = setTimeout(() => {
        call(fn)(payload, {
          ...options,
          cancellable
        });
      }, ms);

      cancellable.onCancel(() => {
        clearTimeout(timerId);
      });

      return cancellable;
    },
    {
      type: flowType
    }
  );
}
