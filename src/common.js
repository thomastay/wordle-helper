/// For misc things
/// Should not depend on DOM elements

// TODO mangle props? Check if mangle props works across a translation unit
export const GuessType = {
  notContained: 0,
  wrong: 1,
  correct: 2,
};

export function assert(ok, message) {
  if (!ok) throw new Error(message);
}
export function isAlpha(str) {
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
// --- count tables ---
export function incCountTable(m, c) {
  let res;
  if ((res = m.get(c))) {
    m.set(c, res + 1);
  } else {
    m.set(c, 1);
  }
}
/** Merge src into dst */
export function mergeCountTable(dst, src) {
  for (const [k, n] of src) {
    // don't override the value since it's bigger
    if (dst.get(k) > n) continue;
    dst.set(k, n);
  }
}
// lower to 0, no lower.
export function decCountTable(m, c) {
  let res;
  if ((res = m.get(c))) {
    if (res == 1) {
      m.delete(c);
    } else {
      m.set(c, res - 1);
    }
  }
}
export function incSetTable(m, i, c) {
  let res;
  if ((res = m.get(i))) {
    res.add(c);
  } else {
    m.set(i, new Set([c]));
  }
}
/** Whether m1 is a subset of m2 */
function isSubset(m1, m2) {
  for (const [k, v] of m1) {
    let m2Val;
    if ((m2Val = m2.get(k))) {
      if (m2Val < v) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}

export function setUnion(setA, setB) {
  for (let elem of setB) {
    setA.add(elem);
  }
}

export function unreachable() {
  throw new Error("unreachable");
}
