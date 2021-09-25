import type { Delta } from "./types";

type Context = {
  left: any;
  delta: Delta;
  children?: Array<Context>;
  result: unknown;
  name?: string | number;
  nested?: boolean;
};

export function patch<TLeft extends any>(params: {
  left: TLeft;
  delta: Delta;
}): TLeft {
  const context: Context = {
    left: params.left,
    delta: params.delta,
    children: undefined,
    result: undefined,
    name: undefined,
    nested: false,
  };

  function process(context: Context) {
    nested_collectChildrenPatchFilter(context);
    array_collectChildrenPatchFilter(context);
    trivial_patchFilter(context);
    nested_patchFilter(context);
    array_patchFilter(context);

    if (context.children) {
      for (const childrenContext of context.children) {
        process(childrenContext);

        context.result =
          context.result ??
          (typeof childrenContext.name === "number" ? [] : {});
        (context.result as object)[childrenContext.name!] =
          childrenContext.result;
      }
    }
  }

  process(context);

  return context.result as TLeft;
}

function nested_collectChildrenPatchFilter(context: Context) {
  if (!context || !context.children) {
    return;
  }
  if (context.delta._t) {
    return;
  }

  let length = context.children.length;
  let child;

  for (let index = 0; index < length; index++) {
    child = context.children[index];
    if (
      Object.prototype.hasOwnProperty.call(context.left, child.name!) &&
      child.result === undefined
    ) {
      delete context.left[child.name!];
    } else if (context.left[child.name!] !== child.result) {
      context.left[child.name!] = child.result;
    }
  }
  context.result = context.left;
}

function array_collectChildrenPatchFilter(context: Context) {
  if (!context || !context.children) {
    return;
  }
  if (context.delta._t !== "a") {
    return;
  }
  let length = context.children.length;
  let child;
  for (let index = 0; index < length; index++) {
    child = context.children[index];
    context.left[child.name!] = child.result;
  }
  context.result = context.left;
}

function trivial_patchFilter(context: Context) {
  if (typeof context.delta === "undefined") {
    context.result = context.left;
    return;
  }
  context.nested = !Array.isArray(context.delta);
  if (context.nested) {
    return;
  }
  if (context.delta.length === 1) {
    context.result = context.delta[0];
    return;
  }
  if (context.delta.length === 2) {
    context.result = context.delta[1];
    return;
  }
  if (context.delta.length === 3 && context.delta[2] === 0) {
    context.result = undefined;
  }
}

function nested_patchFilter(context: Context) {
  if (!context.nested) {
    return;
  }
  if (context.delta._t) {
    return;
  }
  let name;
  let child;
  for (name in context.delta) {
    if (context.children === undefined) {
      context.children = [];
    }
    context.children.push({
      left: context.left[name],
      delta: context.delta[name],
      result: undefined,
      name,
    });
  }
}

const ARRAY_MOVE = 3;

let compare = {
  numerically(a: number, b: number) {
    return a - b;
  },
  numericallyBy(name: string) {
    return (a: any, b: any) => a[name] - b[name];
  },
};

function array_patchFilter(context: Context) {
  if (!context.nested) {
    return;
  }
  if (context.delta._t !== "a") {
    return;
  }
  let index;
  let index1;

  let delta = context.delta;
  let array = context.left;

  // first, separate removals, insertions and modifications
  let toRemove = [];
  let toInsert = [];
  let toModify = [];
  for (index in delta) {
    if (index !== "_t") {
      if (index[0] === "_") {
        // removed item from original array
        if (delta[index][2] === 0 || delta[index][2] === ARRAY_MOVE) {
          toRemove.push(parseInt(index.slice(1), 10));
        } else {
          throw new Error(
            `only removal or move can be applied at original array indices,` +
              ` invalid diff type: ${delta[index][2]}`
          );
        }
      } else {
        if (delta[index].length === 1) {
          // added item at new array
          toInsert.push({
            index: parseInt(index, 10),
            value: delta[index][0],
          });
        } else {
          // modified item at new array
          toModify.push({
            index: parseInt(index, 10),
            delta: delta[index],
          });
        }
      }
    }
  }

  // remove items, in reverse order to avoid sawing our own floor
  toRemove = toRemove.sort(compare.numerically);
  for (index = toRemove.length - 1; index >= 0; index--) {
    index1 = toRemove[index];
    let indexDiff = delta[`_${index1}`];
    let removedValue = array.splice(index1, 1)[0];
    if (indexDiff[2] === ARRAY_MOVE) {
      // reinsert later
      toInsert.push({
        index: indexDiff[1],
        value: removedValue,
      });
    }
  }

  // insert items, in reverse order to avoid moving our own floor
  toInsert = toInsert.sort(compare.numericallyBy("index"));
  let toInsertLength = toInsert.length;
  for (index = 0; index < toInsertLength; index++) {
    let insertion = toInsert[index];
    array.splice(insertion.index, 0, insertion.value);
  }

  // apply modifications
  let toModifyLength = toModify.length;
  if (toModifyLength > 0) {
    for (index = 0; index < toModifyLength; index++) {
      let modification = toModify[index];
      if (context.children === undefined) {
        context.children = [];
      }
      context.children.push({
        left: context.left[modification.index],
        delta: modification.delta,
        name: modification.index,
        result: undefined,
      });
    }
  }

  if (!context.children) {
    context.result = context.left;
    return;
  }
}
