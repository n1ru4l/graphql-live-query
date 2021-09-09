// Throttle tests derived from https://github.com/PacoteJS/pacote
import { throttle } from "./throttle";

const tock = (() => {
  let spy: jest.SpyInstance<number, []> = jest.fn()
  let mockedTime = 0

  return {
    useFakeTime(time = 0) {
      mockedTime = time
      spy.mockRestore()
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockedTime)
      jest.useFakeTimers()
    },

    advanceTime(time = 0) {
      mockedTime = mockedTime + time
      spy.mockReturnValue(mockedTime)
      jest.advanceTimersByTime(time)
    },

    useRealTime() {
      spy.mockRestore()
      jest.useRealTimers()
    },
  }
})()

afterEach(tock.useRealTime)

test(`throttled function is called immediately`, () => {
  const fn = jest.fn()
  const { run: throttledFn } = throttle(fn, 10);

  throttledFn()

  expect(fn).toHaveBeenCalledTimes(1)
})

test(`throttled function is called with the passed arguments`, () => {
  const fn = jest.fn()
  const { run: throttledFn } = throttle(fn, 10);

  throttledFn(1, 2, 3)

  expect(fn).toHaveBeenCalledWith(1, 2, 3)
})

test(`throttled functions can be called past the delay interval`, () => {
  tock.useFakeTime(Date.now());

  const fn = jest.fn();
  const { run: throttledFn } = throttle(fn, 100);

  throttledFn(1);
  throttledFn(2);
  tock.advanceTime(100);
  throttledFn(3);
  tock.advanceTime(100);

  expect(fn).toHaveBeenCalledTimes(3);
})

test(`throttled function can be called at most once during the delay interval`, () => {
  tock.useFakeTime(Date.now())

  const fn = jest.fn()
  const { run: throttledFn } = throttle(fn, 100);

  throttledFn(1)
  throttledFn(2)
  tock.advanceTime(99)

  expect(fn).toHaveBeenCalledWith(1)
  expect(fn).not.toHaveBeenCalledWith(2)
})

test(`throttled function only considers the most recent call`, () => {
  tock.useFakeTime(Date.now())

  const fn = jest.fn();
  const { run: throttledFn } = throttle(fn, 100);

  throttledFn(1);
  throttledFn(2);
  throttledFn(3);
  tock.advanceTime(100);

  expect(fn).toHaveBeenCalledWith(1);
  expect(fn).not.toHaveBeenCalledWith(2);
  expect(fn).toHaveBeenCalledWith(3);
})

test(`cancelling pending function calls`, () => {
  tock.useFakeTime(Date.now())

  const fn = jest.fn()
  const { run: throttledFn, cancel } = throttle(fn, 100);

  throttledFn(1);
  throttledFn(2);
  cancel();
  tock.advanceTime(100);
  throttledFn(3);
  tock.advanceTime(100)

  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith(1)
  expect(fn).not.toHaveBeenCalledWith(2)
  expect(fn).not.toHaveBeenCalledWith(3)
})
