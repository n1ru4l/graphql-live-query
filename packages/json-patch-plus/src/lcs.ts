/**
 * LCS implementation that supports arrays or strings
 *
 * reference: http://en.wikipedia.org/wiki/Longest_common_subsequence_problem
 */

export function defaultMatch(
  array1: Array<unknown>,
  array2: Array<unknown>,
  index1: number,
  index2: number
) {
  return array1[index1] === array2[index2];
}

type MatchFunction = (
  array1: Array<unknown>,
  array2: Array<unknown>,
  index1: number,
  index2: number,
  context?: unknown
) => boolean | undefined;

type Matrix = Array<number | Array<number>> & {
  match: MatchFunction;
};

export function lengthMatrix(
  array1: Array<unknown>,
  array2: Array<unknown>,
  match: MatchFunction,
  context?: unknown
) {
  const len1 = array1.length;
  const len2 = array2.length;

  // initialize empty matrix of len1+1 x len2+1
  let matrix: Matrix = Object.assign([len1 + 1], {
    match,
  });

  for (let x = 0; x < len1 + 1; x++) {
    matrix[x] = [len2 + 1];
    for (let y = 0; y < len2 + 1; y++) {
      matrix[x][y] = 0;
    }
  }
  // save sequence lengths for each coordinate
  for (let x = 1; x < len1 + 1; x++) {
    for (let y = 1; y < len2 + 1; y++) {
      if (match(array1, array2, x - 1, y - 1, context)) {
        matrix[x][y] = matrix[x - 1][y - 1] + 1;
      } else {
        matrix[x][y] = Math.max(matrix[x - 1][y], matrix[x][y - 1]);
      }
    }
  }
  return matrix;
}

type Subsequence = {
  sequence: Array<unknown>;
  indices1: Array<number>;
  indices2: Array<number>;
};

export function backtrack(
  matrix: Matrix,
  array1: Array<unknown>,
  array2: Array<unknown>,
  context?: unknown
) {
  let index1 = array1.length;
  let index2 = array2.length;
  const subsequence: Subsequence = {
    sequence: [],
    indices1: [],
    indices2: [],
  };

  while (index1 !== 0 && index2 !== 0) {
    const sameLetter = matrix.match(
      array1,
      array2,
      index1 - 1,
      index2 - 1,
      context
    );
    if (sameLetter) {
      subsequence.sequence.unshift(array1[index1 - 1]);
      subsequence.indices1.unshift(index1 - 1);
      subsequence.indices2.unshift(index2 - 1);
      --index1;
      --index2;
    } else {
      const valueAtMatrixAbove = matrix[index1][index2 - 1];
      const valueAtMatrixLeft = matrix[index1 - 1][index2];
      if (valueAtMatrixAbove > valueAtMatrixLeft) {
        --index2;
      } else {
        --index1;
      }
    }
  }
  return subsequence;
}

export function get(
  array1: Array<unknown>,
  array2: Array<unknown>,
  match: MatchFunction,
  context?: unknown
) {
  const innerContext = context || {};
  const matrix = lengthMatrix(
    array1,
    array2,
    match || defaultMatch,
    innerContext
  );
  return backtrack(matrix, array1, array2, innerContext);
}
