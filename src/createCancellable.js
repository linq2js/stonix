import createEmitter from "./createEmitter";
import { cancellableType } from "./types";

export default function () {
  const emitter = createEmitter();
  let cancelled = false;
  let disposed = false;

  function dispose() {
    if (disposed) return;
    disposed = true;
    emitter.emit("dispose");
    emitter.clear();
  }

  function cancel() {
    if (cancelled) return;
    cancelled = true;
    emitter.emit("cancel");
  }

  return {
    type: cancellableType,
    onCancel: emitter.get("cancel").on,
    onDispose: emitter.get("dispose").on,
    cancelled: () => cancelled,
    dispose,
    cancel
  };
}
