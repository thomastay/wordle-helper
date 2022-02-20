import { Guess, GuessType, incSetTable, unreachable } from "./common";

// !: order of this type is important, we use Math.max later on
// TODO mangle props
const CharInformationType = {
  notContained: 0,
  min: 1,
  exactly: 2,
} as const;

// TODO figure out how to use CharInformationType as the index
type CharInformation = { type: 0 } | { type: 1; val: number } | { type: 2; val: number };
type PositionMap<T> = Map<number, T>;
type KnownCharInformation = Map<string, CharInformation>;

/**
 * Given a list of guesses, each guess being an array of pairs
 * Create the tables for use in filtering out the valid words
 */
export function compileGuesses(
  guesses: Guess[],
): [PositionMap<string>, PositionMap<Set<string>>, KnownCharInformation, string[]] {
  /* Map of position to char */
  const correct: PositionMap<string> = new Map();
  /** Map of position to set of chars */
  const wrong: PositionMap<Set<string>> = new Map();
  /** List of errors for each guess. Empty string if no errors */
  const errors: string[] = [];

  const knownCharInformation = guesses.reduce(
    // kci --> known char information
    (kci, g) => compileGuess(correct, wrong, errors, kci, g),
    /** Map of char to CharInformation */
    new Map(),
  );
  return [correct, wrong, knownCharInformation, errors];
}

/**
 * Modifies the correct, wrong, and knownCharInformation tables
 * @param guess {[char, number]} Guess is parsed into a pair of (char, GuessType)
 */
function compileGuess(
  correct: PositionMap<string>,
  wrong: PositionMap<Set<string>>,
  errors: string[],
  knownCharInformation: KnownCharInformation,
  guess: Guess,
): KnownCharInformation {
  let errorStr = "";
  const guessKnownCharInformation: KnownCharInformation = new Map();
  guess.forEach(([c, gType], pos) => {
    switch (gType) {
      case GuessType.correct:
        let prevCorr: string | undefined;
        if ((prevCorr = correct.get(pos)) && prevCorr !== c) {
          errorStr += `Correct letter ${c} in position ${pos + 1} conflicts with previous correct letter ${correct.get(
            pos,
          )}. Overwriting. `;
        }
        if (isNotContained(c, knownCharInformation)) {
          errorStr += `Correct letter ${c} in position ${
            pos + 1
          } conflicts with fact that it is not contained previously. Overwriting. `;
          knownCharInformation.delete(c);
        }
        correct.set(pos, c);
        incKnownCharInformation(c, guessKnownCharInformation);
        break;
      case GuessType.wrong:
        if (correct.has(pos)) {
          errorStr += `Wrong letter ${c} in position ${pos + 1} conflicts with previous correct letter ${correct.get(
            pos,
          )}. Overwriting. `;
          correct.delete(pos);
        }
        if (isNotContained(c, knownCharInformation)) {
          errorStr += `Wrong letter ${c} in position ${
            pos + 1
          } conflicts with fact that it is not contained previously. Overwriting. `;
          knownCharInformation.delete(c);
        }
        incSetTable(wrong, pos, c);
        incKnownCharInformation(c, guessKnownCharInformation);
        break;
      case GuessType.notContained:
        // Do nothing, will do it only after correct and wrong has been
        // processed
        break;
      default:
        unreachable();
    }
  }); // end guessForeach

  // Now, process the not contained characters
  guess.forEach(([c, gType], pos) => {
    switch (gType) {
      case GuessType.correct:
      case GuessType.wrong:
        break;
      case GuessType.notContained:
        if (correct.has(pos)) {
          errorStr += `Not contained letter ${c} in position ${
            pos + 1
          } conflicts with previous correct letter ${correct.get(pos)}. Overwriting. `;
          correct.delete(pos);
        }
        const ci = guessKnownCharInformation.get(c);
        switch (ci?.type) {
          case undefined:
            guessKnownCharInformation.set(c, {
              type: CharInformationType.notContained,
            });
          case CharInformationType.notContained:
          case CharInformationType.exactly:
            break; // noop
          case CharInformationType.min: {
            guessKnownCharInformation.set(c, {
              type: CharInformationType.exactly,
              val: ci.val,
            });
            break;
          }
          default:
            unreachable();
        }
        break;
      default:
        unreachable();
    }
  }); // end guessForeach

  const mergeErrStr = mergeKnownCharInformation(knownCharInformation, guessKnownCharInformation);
  if (mergeErrStr) errorStr += mergeErrStr;
  errors.push(errorStr);
  return knownCharInformation;
}

function isNotContained(c: string, knownCharInformation: KnownCharInformation) {
  let ci;
  if ((ci = knownCharInformation.get(c))) {
    return ci.type === CharInformationType.notContained;
  } else return false;
}

function incKnownCharInformation(c: string, knownCharInformation: KnownCharInformation) {
  const ci = knownCharInformation.get(c);
  switch (ci?.type) {
    case undefined:
    case CharInformationType.notContained:
      knownCharInformation.set(c, { type: CharInformationType.min, val: 1 });
      break;
    case CharInformationType.min:
    case CharInformationType.exactly:
      ci.val += 1;
      break;
  }
}

function mergeKnownCharInformation(kci: KnownCharInformation, gcki: KnownCharInformation): string {
  // kci == known char information, gcki = guess known char information
  let errorStr = "";
  for (const [c, ci] of gcki) {
    let currCI;
    if (!(currCI = kci.get(c))) {
      kci.set(c, ci); // just set the guess's information
      continue;
    }
    // If gcki has info and kci does too, merge it correctly
    switch (ci.type) {
      case CharInformationType.notContained:
        break;
      case CharInformationType.min:
      case CharInformationType.exactly: {
        switch (currCI.type) {
          case CharInformationType.notContained:
            kci.set(c, ci);
            break;
          case CharInformationType.min:
          case CharInformationType.exactly: {
            if (ci.type === CharInformationType.exactly && currCI.val > ci.val) {
              errorStr += `Count ${ci.val} for char ${c} is lower than previous count ${currCI.val}. `;
            }
            currCI.val = Math.max(currCI.val, ci.val);
            currCI.type = Math.max(currCI.type, ci.type) as 1 | 2; // override if higher type
            break;
          }
        }
        break;
      }
      default:
        unreachable();
    }
  }
  return errorStr;
}

export function isKnownCharInformationSubset(charCounts: Map<string, number>, kci: KnownCharInformation) {
  for (const [c, ci] of kci) {
    const count = charCounts.get(c) || 0;
    switch (ci.type) {
      case CharInformationType.notContained:
        if (count > 0) return false;
        break;
      case CharInformationType.min:
        if (count < ci.val) return false;
        break;
      case CharInformationType.exactly:
        if (count != ci.val) return false;
        break;
    }
  }
  return true;
}

export function correctToString(correct: PositionMap<string>) {
  const res = [];
  for (const [pos, c] of correct) {
    res.push(`${pos + 1} -> ${c}`);
  }
  return res.join(", ");
}

export function wrongToString(wrong: PositionMap<Set<string>>) {
  const res = [];
  for (const [pos, cs] of wrong) {
    res.push(`${pos + 1} -> [${[...cs.values()]}]`);
  }
  return res.join(", ");
}

export function knownCharInformationToStrings(kci: KnownCharInformation) {
  let res = [];
  const notContained = [...kci.entries()]
    .filter(([_c, { type }]) => type === CharInformationType.notContained)
    .map(([c]) => c);
  res.push(`Letters not present: ${notContained}.`);

  for (const [c, ci] of kci) {
    switch (ci.type) {
      case CharInformationType.notContained:
        break;
      case CharInformationType.min:
        res.push(`At least ${ci.val} ${c}.`);
        break;
      case CharInformationType.exactly:
        res.push(`Exactly ${ci.val} ${c}.`);
        break;
    }
  }
  return res;
}