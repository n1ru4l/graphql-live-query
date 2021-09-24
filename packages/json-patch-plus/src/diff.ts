import * as lcs from "./lcs";

type Patch = unknown;
type Input = unknown;

type ObjectHashFunction = (object: object, index?: number) => string;

type Context = {
  left: Input;
  leftType?: string;
  leftIsArray?: boolean;
  right: Input;
  rightType?: string;
  rightIsArray?: boolean;
  result: unknown;
  children?: Array<Context>;
  name?: string | number;
  includePreviousValue: boolean;
  objectHash?: ObjectHashFunction;
  matchByPosition?: boolean;
};

export type DiffOptions = {
  /**
   * Whether the previous value should be included in the diff.
   * This can drastically increase the patch size and should only be used for debugging
   * or cases where you need to perform more advanced consistency checks.
   * */
  includePreviousValue?: boolean;
  /**
   * A function for generating a identifier from an object in order to produce more performant list update patches.
   */
  objectHash?: ObjectHashFunction;
  /** Actually not sure what this does :) */
  matchByPosition?: boolean;
};

export function diff(
  input: { left: Input; right: Input },
  options?: DiffOptions
): Patch {
  const includePreviousValue = options?.includePreviousValue ?? true;
  const objectHash = options?.objectHash;
  const matchByPosition = options?.matchByPosition;

  const context: Context = {
    result: undefined,
    left: input.left,
    right: input.right,
    includePreviousValue,
    objectHash,
    matchByPosition,
  };

  function process(context: Context) {
    nested_collectChildrenDiffFilter(context);
    trivialDiffFilter(context);
    nested_objectsDiffFilter(context);
    array_diffFilter(context);

    if (context.children?.length) {
      for (const childrenContext of context.children) {
        process(childrenContext);

        if (childrenContext.result !== undefined) {
          context.result = context.result ?? {};
          (context.result as object)[childrenContext.name!] =
            childrenContext.result;
        }
      }
      if (context.result && context.leftIsArray) {
        (context.result as any)._t = "a";
      }
    }
  }

  process(context);

  return context.result;
}

// diff primitive values and non arrays
function trivialDiffFilter(context: Context) {
  if (context.left === context.right) {
    context.result = undefined;
    return;
  }

  // Item was added
  if (typeof context.left === "undefined") {
    context.result = [context.right];
    return;
  }

  // Item was removed
  if (typeof context.right === "undefined") {
    const previousValue = context.includePreviousValue ? context.left : null;
    context.result = [previousValue, 0, 0];
    return;
  }

  context.leftType = context.left === null ? "null" : typeof context.left;
  context.rightType = context.right === null ? "null" : typeof context.right;
  if (context.leftType !== context.rightType) {
    const previousValue = context.includePreviousValue ? context.left : null;

    context.result = [previousValue, context.right];
    return;
  }
  if (context.leftType === "boolean" || context.leftType === "number") {
    const previousValue = context.includePreviousValue ? context.left : null;
    context.result = [previousValue, context.right];
    return;
  }
  if (context.leftType === "object") {
    context.leftIsArray = Array.isArray(context.left);
  }
  if (context.rightType === "object") {
    context.rightIsArray = Array.isArray(context.right);
  }
  if (context.leftIsArray !== context.rightIsArray) {
    const previousValue = context.includePreviousValue ? context.left : null;
    context.result = [previousValue, context.right];
    return;
  }
}

function nested_collectChildrenDiffFilter(context: Context) {
  if (!context || !context.children) {
    return;
  }

  const length = context.children.length;
  let child;
  let result = context.result as object;
  for (let index = 0; index < length; index++) {
    child = context.children[index];
    if (typeof child.result === "undefined") {
      continue;
    }
    result = result ?? {};
    result[child.name!] = child.result;
  }
  if (result && context.leftIsArray) {
    result["_t"] = "a";
  }
  context.result = result;
}

function nested_objectsDiffFilter(context: Context) {
  if (context.leftIsArray || context.leftType !== "object") {
    return;
  }

  const left = context.left as Record<string | number | symbol, unknown>;
  const right = context.right as Record<string | number | symbol, unknown>;

  for (const name in left) {
    if (!Object.prototype.hasOwnProperty.call(context.left, name)) {
      continue;
    }

    if (context.children === undefined) {
      context.children = [];
    }
    context.children.push({
      left: left[name],
      right: right[name],
      result: undefined,
      name,
      includePreviousValue: context.includePreviousValue,
      objectHash: context.objectHash,
      matchByPosition: context.matchByPosition,
    });
  }
  for (const name in right) {
    if (!Object.prototype.hasOwnProperty.call(context.right, name)) {
      continue;
    }

    if (typeof left[name] === "undefined") {
      if (context.children === undefined) {
        context.children = [];
      }
      context.children.push({
        left: undefined,
        right: right[name],
        result: undefined,
        name,
        includePreviousValue: context.includePreviousValue,
        objectHash: context.objectHash,
        matchByPosition: context.matchByPosition,
      });
    }
  }

  if (!context.children || context.children.length === 0) {
    context.result = undefined;
  }
}

export type MatchContext = {
  objectHash?: ObjectHashFunction;
  matchByPosition: boolean | undefined;
  hashCache1?: Array<unknown>;
  hashCache2?: Array<unknown>;
};

const ARRAY_MOVE = 3;

function array_diffFilter(context: Context) {
  if (!context.leftIsArray) {
    return;
  }

  let matchContext: MatchContext = {
    objectHash: context.objectHash,
    matchByPosition: context.matchByPosition,
  };

  let commonHead = 0;
  let commonTail = 0;
  let index;
  let index1;
  let index2;
  const array1 = context.left as Array<unknown>;
  const array2 = context.right as Array<unknown>;
  const len1 = array1.length;
  const len2 = array2.length;

  if (
    len1 > 0 &&
    len2 > 0 &&
    !matchContext.objectHash &&
    typeof matchContext.matchByPosition !== "boolean"
  ) {
    matchContext.matchByPosition = !arraysHaveMatchByRef(
      array1,
      array2,
      len1,
      len2
    );
  }

  // separate common head
  while (
    commonHead < len1 &&
    commonHead < len2 &&
    matchItems(array1, array2, commonHead, commonHead, matchContext)
  ) {
    index = commonHead;
    const left = context.left as Array<unknown>;
    const right = context.right as Array<unknown>;
    if (context.children === undefined) {
      context.children = [];
    }

    context.children.push({
      left: left[index],
      right: right[index],
      result: undefined,
      name: index,
      includePreviousValue: context.includePreviousValue,
      objectHash: context.objectHash,
      matchByPosition: context.matchByPosition,
    });
    commonHead++;
  }
  // separate common tail
  while (
    commonTail + commonHead < len1 &&
    commonTail + commonHead < len2 &&
    matchItems(
      array1,
      array2,
      len1 - 1 - commonTail,
      len2 - 1 - commonTail,
      matchContext
    )
  ) {
    index1 = len1 - 1 - commonTail;
    index2 = len2 - 1 - commonTail;
    const left = context.left as Array<unknown>;
    const right = context.right as Array<unknown>;

    if (context.children === undefined) {
      context.children = [];
    }

    context.children.push({
      left: left[index1],
      right: right[index2],
      result: undefined,
      name: index2,
      includePreviousValue: context.includePreviousValue,
      objectHash: context.objectHash,
      matchByPosition: context.matchByPosition,
    });

    commonTail++;
  }

  if (commonHead + commonTail === len1) {
    if (len1 === len2) {
      // arrays are identical
      context.result = undefined;
      return;
    }
    // trivial case, a block (1 or more consecutive items) was added
    const result = {
      _t: "a",
    };

    for (index = commonHead; index < len2 - commonTail; index++) {
      result[index] = [array2[index]];
    }
    context.result = result;
    return;
  }
  if (commonHead + commonTail === len2) {
    // trivial case, a block (1 or more consecutive items) was removed
    const result = {
      _t: "a",
    };

    for (index = commonHead; index < len1 - commonTail; index++) {
      result[`_${index}`] = [
        context.includePreviousValue ? array1[index] : null,
        0,
        0,
      ];
    }
    context.result = result;
    return;
  }

  // reset hash cache
  delete matchContext.hashCache1;
  delete matchContext.hashCache2;

  // diff is not trivial, find the LCS (Longest Common Subsequence)
  let trimmed1 = array1.slice(commonHead, len1 - commonTail);
  let trimmed2 = array2.slice(commonHead, len2 - commonTail);
  let seq = lcs.get(trimmed1, trimmed2, matchItems as any, matchContext);
  let removedItems = [];
  const result = {
    _t: "a",
  };
  for (index = commonHead; index < len1 - commonTail; index++) {
    if (seq.indices1.indexOf(index - commonHead) < 0) {
      // removed
      result[`_${index}`] = [
        context.includePreviousValue ? array1[index] : null,
        0,
        0,
      ];
      removedItems.push(index);
    }
  }

  const detectMove = true;

  let includeValueOnMove = true;

  let removedItemsLength = removedItems.length;
  for (index = commonHead; index < len2 - commonTail; index++) {
    let indexOnArray2 = seq.indices2.indexOf(index - commonHead);
    if (indexOnArray2 < 0) {
      // added, try to match with a removed item and register as position move
      let isMove = false;
      if (detectMove && removedItemsLength > 0) {
        for (
          let removeItemIndex1 = 0;
          removeItemIndex1 < removedItemsLength;
          removeItemIndex1++
        ) {
          index1 = removedItems[removeItemIndex1];
          if (
            matchItems(
              trimmed1,
              trimmed2,
              index1 - commonHead,
              index - commonHead,
              matchContext
            )
          ) {
            // store position move as: [originalValue, newPosition, ARRAY_MOVE]
            result[`_${index1}`].splice(1, 2, index, ARRAY_MOVE);
            if (!includeValueOnMove) {
              // don't include moved value on diff, to save bytes
              result[`_${index1}`][0] = "";
            }

            index2 = index;

            if (context.children === undefined) {
              context.children = [];
            }
            const left = context.left as Array<unknown>;
            const right = context.right as Array<unknown>;

            context.children.push({
              left: left[index1],
              right: right[index2],
              result: undefined,
              name: index2,
              includePreviousValue: context.includePreviousValue,
              objectHash: context.objectHash,
              matchByPosition: context.matchByPosition,
            });

            removedItems.splice(removeItemIndex1, 1);
            isMove = true;
            break;
          }
        }
      }
      if (!isMove) {
        // added
        result[index] = [array2[index]];
      }
    } else {
      // match, do inner diff
      index1 = seq.indices1[indexOnArray2] + commonHead;
      index2 = seq.indices2[indexOnArray2] + commonHead;

      if (context.children === undefined) {
        context.children = [];
      }
      const left = context.left as Array<unknown>;
      const right = context.right as Array<unknown>;

      context.children.push({
        left: left[index1],
        right: right[index2],
        result: undefined,
        name: index2,
        includePreviousValue: context.includePreviousValue,
        objectHash: context.objectHash,
        matchByPosition: context.matchByPosition,
      });
    }
  }

  context.result = result;
}

function arraysHaveMatchByRef(
  array1: Array<unknown>,
  array2: Array<unknown>,
  len1: number,
  len2: number
): boolean {
  for (let index1 = 0; index1 < len1; index1++) {
    let val1 = array1[index1];
    for (let index2 = 0; index2 < len2; index2++) {
      let val2 = array2[index2];
      if (index1 !== index2 && val1 === val2) {
        return true;
      }
    }
  }
  return false;
}

function matchItems(
  array1: Array<unknown>,
  array2: Array<unknown>,
  index1: number,
  index2: number,
  context: MatchContext
) {
  let value1 = array1[index1];
  let value2 = array2[index2];
  if (value1 === value2) {
    return true;
  }
  if (typeof value1 !== "object" || typeof value2 !== "object") {
    return false;
  }
  let objectHash = context.objectHash;
  if (!objectHash) {
    // no way to match objects was provided, try match by position
    return context.matchByPosition && index1 === index2;
  }
  let hash1;
  let hash2;
  if (typeof index1 === "number") {
    context.hashCache1 = context.hashCache1 || [];
    hash1 = context.hashCache1[index1];
    if (typeof hash1 === "undefined") {
      context.hashCache1[index1] = hash1 = objectHash(value1 as object, index1);
    }
  } else {
    hash1 = objectHash(value1 as object);
  }
  if (typeof hash1 === "undefined") {
    return false;
  }
  if (typeof index2 === "number") {
    context.hashCache2 = context.hashCache2 || [];
    hash2 = context.hashCache2[index2];
    if (typeof hash2 === "undefined") {
      context.hashCache2[index2] = hash2 = objectHash(value2 as object, index2);
    }
  } else {
    hash2 = objectHash(value2 as object);
  }
  if (typeof hash2 === "undefined") {
    return false;
  }
  return hash1 === hash2;
}
