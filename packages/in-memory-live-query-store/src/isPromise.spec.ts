import { isPromise } from "./isPromise";

const createDeferred = <T = void>() => {
  const r = {} as any;
  r.promise = new Promise((resolve, reject) => {
    r.resolve = resolve;
    r.reject = reject;
  });

  return r as {
    promise: Promise<T>;
    reject: (err: any) => void;
    resolve: (value?: T) => void;
  };
};

it("returns true if input is a promise-like object", async () => {
  const d = createDeferred();
  try {
    expect(isPromise(d.promise)).toEqual(true);
  } finally {
    d.resolve();
    await d.promise;
  }
});

it("returns false if input is not a promise-like object", async () => {
  const input = {};
  expect(isPromise(input)).toEqual(false);
});
