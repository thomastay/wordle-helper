/// For misc things
/// Should not depend on DOM elements

// TODO mangle props? Check if mangle props works across a translation unit
export const GuessType = {
  notContained: 0,
  wrong: 1,
  correct: 2,
};

export function assert(ok: boolean, message: string) {
  if (!ok) throw new Error(message);
}
export function isAlpha(str: string) {
  var code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (
      !(code > 64 && code < 91) &&
      // upper alpha (A-Z)
      !(code > 96 && code < 123)
    ) {
      // lower alpha (a-z)
      return false;
    }
  }
  return true;
}

type CountTable = Map<string, number>;
// --- count tables ---
export function incCountTable(m: CountTable, c: string) {
  let res;
  if ((res = m.get(c))) {
    m.set(c, res + 1);
  } else {
    m.set(c, 1);
  }
}

export function incSetTable(m: Map<number, Set<string>>, i: number, c: string) {
  let res;
  if ((res = m.get(i))) {
    res.add(c);
  } else {
    m.set(i, new Set([c]));
  }
}

export function setUnion(setA: Set<string>, setB: Set<string>) {
  for (let elem of setB) {
    setA.add(elem);
  }
}

export function unreachable() {
  throw new Error("unreachable");
}

/// types
//

export type Guess = [string, number][];
export type PositionMap<T> = Map<number, T>;

// !: order of this type is important, we use Math.max later on
// TODO mangle props
export const CharInformationType = {
  notContained: 0,
  min: 1,
  exactly: 2,
} as const;

// TODO figure out how to use CharInformationType as the index
export type CharInformation = { type: 0 } | { type: 1; val: number } | { type: 2; val: number };
export type KnownCharInformation = Map<string, CharInformation>;
