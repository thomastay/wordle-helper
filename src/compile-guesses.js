import { GuessType, incSetTable, unreachable } from "./common";

// !: order of this type is important, we use Math.max later on
// TODO mangle props
const CharInformationType = {
  notContained: 0,
  min: 1,
  exactly: 2,
};

// ts-check:
// type CharInformation =
//  { type: CharInformationType.notContained, val: undefined }
//  { type: CharInformationType.min,         val: number }
//  { type: CharInformationType.exactly,      val: number }

/**
 * Given a list of guesses, each guess being an array of pairs
 * Create the tables for use in filtering out the valid words
 */
export function compileGuesses(guesses) {
  /* Map of position to char */
  const correct = new Map();
  /** Map of position to set of chars */
  const wrong = new Map();
  /** List of errors for each guess. Empty string if no errors */
  const errors = [];

  const knownCharInformation = guesses.reduce(
    // kci --> known char information
    (kci, g, gnum) => compileGuess(correct, wrong, errors, kci, g, gnum),
    /** Map of char to CharInformation */
    new Map(),
  );
  return [
    correct,
    wrong,
    knownCharInformation,
    errors,
  ];
}

/**
 * Modifies the correct, wrong, and knownCharInformation tables
 * @param guess {[char, number]} Guess is parsed into a pair of (char, GuessType)
 */
function compileGuess(correct, wrong, errors, knownCharInformation, guess, guessNum) {
  let errorStr = "";
  const guessKnownCharInformation = new Map();
  guess.forEach(([c, gType], pos) => {
    switch (gType) {
      case GuessType.correct:
        let prevCorr;
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
        // decCountTable(contained, c);
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

function isNotContained(c, knownCharInformation) {
  let ci;
  if ((ci = knownCharInformation.get(c))) {
    return ci.type === CharInformationType.notContained;
  } else return false;
}

function incKnownCharInformation(c, knownCharInformation) {
  const ci = knownCharInformation.get(c);
  if (!ci) {
    knownCharInformation.set(c, { type: CharInformationType.min, val: 1 });
  } else {
    ci.val += 1;
  }
}

function mergeKnownCharInformation(kci, gcki) {
  // kci == known char information, gcki = guess known char information
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
            currCI.type = Math.max(currCI.type, ci.type); // override if higher type
            break;
          }
        }
        break;
      }
      default:
        unreachable();
    }
  }
}

export function isKnownCharInformationSubset(charCounts, kci) {
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

export function correctToString(correct) {
  const res = [];
  for (const [pos, c] of correct) {
    res.push(`${pos+1} -> ${c}`);
  }
  return res.join(", ");
}

export function wrongToString(wrong) {
  const res = [];
  for (const [pos, cs] of wrong) {
    res.push(`${pos+1} -> [${[...cs.values()]}]`);
  }
  return res.join(", ");
}

export function knownCharInformationToStrings(kci) {
  let res = [];
  const notContained = [...kci.entries()].filter(([_c, {type}]) => type === CharInformationType.notContained).map(([c]) => c);
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
