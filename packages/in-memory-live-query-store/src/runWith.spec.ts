import { runWith } from "./runWith.js";

it("invokes a callback synchronously for a sync value", (done) => {
  let value = 1;
  runWith(value, (value) => {
    expect(value).toEqual(1);

    done();
  });
  value = -1;
});

it("invokes a callback asynchronously for a async value", (done) => {
  let outerValue = 1;
  runWith(Promise.resolve(10), (value) => {
    expect(value).toEqual(10);
    expect(outerValue).toEqual(-1);
    done();
  });
  outerValue = -1;
});
