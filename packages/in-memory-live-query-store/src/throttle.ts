export interface ThrottledFunction {
  run: (...args: unknown[]) => void;
  cancel: () => void;
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 */
export const throttle = <T>(
  fn: (...args: unknown[]) => T | Promise<T>,
  wait: number
): ThrottledFunction => {
  let timeout: ReturnType<typeof setTimeout>;
  let lastCalled = 0;
  let cancelled = false;

  const exec = (...args: unknown[]) => {
    if (!cancelled) {
      fn(...args);
      lastCalled = Date.now();
    }
  };

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
    cancel,
  };
};
