import { runWith } from "./runWith";

export interface ThrottledFunction {
  run: (...args: unknown[]) => void;
  cancel: () => void;
}

export const throttle = <T>(fn: (...args: unknown[]) => T | Promise<T>, wait: number): ThrottledFunction => {
  let timeout: ReturnType<typeof setTimeout>;
  let lastCalled = 0;
  let cancelled = false;

  const exec = (...args: unknown[]) => {
    if (!cancelled) {
      runWith(fn(...args), () => {
        lastCalled = Date.now();
      });
    }
  }

  const run = (...args: unknown[]) => {
    if (cancelled) {
      return;
    }

    const timeToNextTick = Math.max(0, wait - (Date.now() - lastCalled));
    if (!timeToNextTick) {
      // first execution, or wait === 0
      exec(...args);
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (Date.now() - lastCalled >= wait) {
          exec(...args);
        }
      }, timeToNextTick);
    }
  };

  const cancel = () => {
    cancelled = true;
    clearTimeout(timeout);
  };

  return {
    run,
    cancel
  }
};
