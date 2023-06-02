import type { Delta } from "./types.js";

type Context = {
  delta: Delta;
  children?: Array<Context>;
  result?: Delta;
  name?: string | number;
  newName?: string | number;
  nested?: boolean;
  stopped: boolean;
};

let TEXT_DIFF = 2;
let DEFAULT_MIN_LENGTH = 60;
let cachedDiffPatch = null;

const { isArray } = Array;
const ARRAY_MOVE = 3;

export function reverse(delta: Delta): Delta {
  const context: Context = {
    delta,
    children: undefined,
    name: undefined,
    nested: false,
    stopped: false,
  };

  function process(context: Context) {
    const steps = [
      nested_collectChildrenReverseFilter,
      array_collectChildrenReverseFilter,
      trivial_reverseFilter,
      text_reverseFilter,
      nested_reverseFilter,
      array_reverseFilter,
    ];

    for (const step of steps) {
      step(context);
      if (context.stopped) {
        context.stopped = false;
        break;
      }
    }

    if (context.children) {
      for (const childrenContext of context.children) {
        process(childrenContext);
        context.result = context.result ?? context.delta;
        if ("result" in childrenContext === false) {
          delete (context.result as object)[childrenContext.name!];
        } else {
          (context.result as object)[childrenContext.name!] =
            childrenContext.result;
        }
      }
    }
  }

  process(context);

  return context.result as Delta;
}

function array_reverseFilter(context: Context) {
  if (!context.nested) {
    if (context.delta[2] === ARRAY_MOVE && context.name) {
      context.newName = `_${context.delta[1]}`;
      const name = context.name as string;
      context.result = [
        context.delta[0],
        parseInt(name.substr(1), 10),
        ARRAY_MOVE,
      ];
      context.stopped = true;
    }
    return;
  }
  if (context.delta._t !== "a") {
    return;
  }

  for (const name in context.delta) {
    if (name === "_t") {
      continue;
    }
    if (context.children === undefined) {
      context.children = [];
    }
    context.children.push({
      delta: context.delta[name],
      name,
      stopped: false,
    });
  }
  context.stopped = true;
}

let array_reverseDeltaIndex = (
  delta: Delta,
  index: string | number,
  itemDelta: Delta
) => {
  if (typeof index === "string" && index[0] === "_") {
    return parseInt(index.substr(1), 10);
  } else if (isArray(itemDelta) && itemDelta[2] === 0) {
    return `_${index}`;
  }

  let reverseIndex = +index;
  for (let deltaIndex in delta) {
    let deltaItem = delta[deltaIndex];
    if (isArray(deltaItem)) {
      if (deltaItem[2] === ARRAY_MOVE) {
        let moveFromIndex = parseInt(deltaIndex.substr(1), 10);
        let moveToIndex = deltaItem[1];
        if (moveToIndex === +index) {
          return moveFromIndex;
        }
        if (moveFromIndex <= reverseIndex && moveToIndex > reverseIndex) {
          reverseIndex++;
        } else if (
          moveFromIndex >= reverseIndex &&
          moveToIndex < reverseIndex
        ) {
          reverseIndex--;
        }
      } else if (deltaItem[2] === 0) {
        let deleteIndex = parseInt(deltaIndex.substr(1), 10);
        if (deleteIndex <= reverseIndex) {
          reverseIndex++;
        }
      } else if (deltaItem.length === 1 && Number(deltaIndex) <= reverseIndex) {
        reverseIndex--;
      }
    }
  }

  return reverseIndex;
};

export function array_collectChildrenReverseFilter(context: Context) {
  if (!context?.children) {
    return;
  }
  if (context.delta._t !== "a") {
    return;
  }
  let length = context.children.length;
  let child;
  let delta = {
    _t: "a",
  };

  for (let index = 0; index < length; index++) {
    child = context.children[index] as Context;
    let name = child.newName;
    if (typeof name === "undefined" && child.name && child.result) {
      name = array_reverseDeltaIndex(
        context.delta,
        child.name,
        child.result
      ) as string | number;
      // @ts-ignore
    } else if (delta[name] !== child.result) {
      // @ts-ignore
      delta[name] = child.result;
    }
  }
  context.result = delta;
  context.stopped = true;
}

export function nested_collectChildrenReverseFilter(context: Context) {
  if (!context?.children) {
    return;
  }
  if (context.delta._t) {
    return;
  }
  let length = context.children.length;
  let child;
  let delta = {};
  for (let index = 0; index < length; index++) {
    child = context.children[index];
    // @ts-ignore
    if (delta[child.name] !== child.result) {
      // @ts-ignore
      delta[child.name] = child.result;
    }
  }
  context.result = delta;
  context.stopped = true;
}

export function nested_reverseFilter(context: Context) {
  if (!context.nested) {
    return;
  }
  if (context.delta._t) {
    return;
  }

  let child;
  for (const name in context.delta) {
    if (context.children === undefined) {
      context.children = [];
    }
    context.children.push({
      delta: context.delta[name],
      name,
      stopped: false,
    });
  }
  context.stopped = true;
}

export function trivial_reverseFilter(context: Context) {
  if (typeof context.delta === "undefined") {
    context.result = context.delta;
    context.stopped = true;
    return;
  }
  context.nested = !isArray(context.delta);
  if (context.nested) {
    return;
  }
  if (context.delta.length === 1) {
    context.result = [context.delta[0], 0, 0];
    context.stopped = true;
    return;
  }
  if (context.delta.length === 2) {
    context.result = [context.delta[1], context.delta[0]];
    context.stopped = true;
    return;
  }
  if (context.delta.length === 3 && context.delta[2] === 0) {
    context.result = context.delta[0];
  }
}

export function text_reverseFilter(context: Context) {
  if (context.nested) {
    return;
  }
  if (context.delta[2] !== TEXT_DIFF) {
    return;
  }

  // text-diff, use a text-diff algorithm
  context.result = [textDeltaReverse(context.delta[0]), 0, TEXT_DIFF];
  context.stopped = true;
}

const textDeltaReverse = function (delta: string) {
  let i;
  let l;
  let lines;
  let line;
  let lineTmp;
  let header = null;
  const headerRegex = /^@@ +-(\d+),(\d+) +\+(\d+),(\d+) +@@$/;
  let lineHeader;
  lines = delta.split("\n");
  for (i = 0, l = lines.length; i < l; i++) {
    line = lines[i];
    let lineStart = line.slice(0, 1);
    if (lineStart === "@") {
      header = headerRegex.exec(line) as string[];
      lineHeader = i;

      // fix header
      lines[
        lineHeader
      ] = `@@ -${header[3]},${header[4]} +${header[1]},${header[2]} @@`;
    } else if (lineStart === "+") {
      lines[i] = `-${lines[i].slice(1)}`;
      if (lines[i - 1].slice(0, 1) === "+") {
        // swap lines to keep default order (-+)
        lineTmp = lines[i];
        lines[i] = lines[i - 1];
        lines[i - 1] = lineTmp;
      }
    } else if (lineStart === "-") {
      lines[i] = `+${lines[i].slice(1)}`;
    }
  }
  return lines.join("\n");
};
