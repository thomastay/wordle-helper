/// For misc things
/// Should not depend on DOM elements

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

export type CountTable<T> = Map<T, number>;
// --- count tables ---
export function incCountTable<T>(m: CountTable<T>, c: T) {
  let res;
  if ((res = m.get(c))) {
    m.set(c, res + 1);
  } else {
    m.set(c, 1);
  }
}

export function sortedCountTable<T>(m: CountTable<T>): CountTable<T> {
  const keys = [...m.keys()].sort();
  const res: CountTable<T> = new Map();
  for (const key of keys) {
    res.set(key, m.get(key) as number);
  }
  return res;
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

export const NERDY_DECIMAL_LEN = 4; // 4 decimal points makes it look super accurate

export function mapToObj(m: Map<number, unknown>): object {
  const result: Record<string, unknown> = {};
  for (const [k, v] of m) {
    result[k] = v;
  }
  return result;
}

/// types
//

// TODO mangle props? Check if mangle props works across a translation unit
export const GuessType = {
  notContained: 0,
  wrong: 1,
  correct: 2,
};

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
