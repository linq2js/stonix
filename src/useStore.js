import { useRef, useEffect, useState } from "react";

export default function useStore(
  { onChange, getState, selectorMap },
  selector
) {
  const data = useRef({}).current;
  data.selector = selector;
  data.rerender = useState()[1];

  if (!data.handleChange) {
    data.handleChange = () => {
      if (data.unmount) return;
      data.error = undefined;
      try {
        const next = selector(getState(), selectorMap);
        if (next !== data.prev) {
          data.rerender({});
        }
      } catch (e) {
        data.error = e;
        data.rerender({});
      }
    };
  }

  useEffect(() => () => void (data.unmount = true), [data]);
  useEffect(() => {
    data.handleChange();
    onChange(data.handleChange);
  }, [data, onChange]);

  if (data.error) throw data.error;

  data.prev = selector(getState(), selectorMap);
  return data.prev;
}
