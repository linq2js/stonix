export function delay(ms, value) {
  return new Promise((resolve) => setTimeout(resolve, ms, value));
}

export function debounce(ms, fn) {
  let timerId;
  return function () {
    clearTimeout(timerId);
    setTimeout(fn, ms, ...arguments);
  };
}

export function throttle(ms, fn) {
  let lastExecutionTime = 0;
  let lastResult;
  return function () {
    const now = new Date().getTime();
    if (now - lastExecutionTime > ms) {
      lastExecutionTime = now;
      lastResult = fn(...arguments);
    }
    return lastResult;
  };
}
