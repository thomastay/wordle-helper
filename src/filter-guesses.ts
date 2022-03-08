import { incCountTable, PositionMap, KnownCharInformation } from "./common";
import { isKnownCharInformationSubset } from "./compile-guesses";

export const sortAndFilterGuesses = (
  correct: PositionMap<string>,
  wrong: PositionMap<Set<string>>,
  knownCharInformation: KnownCharInformation,
  solutionWords: string[],
  limit: number,
): [string[], number] => {
  const filtered = filterGuesses(correct, wrong, knownCharInformation, solutionWords);
  // solution words are already in sorted order
  return [filtered.slice(0, limit), filtered.length];
};

export const filterGuesses = (
  correct: PositionMap<string>,
  wrong: PositionMap<Set<string>>,
  knownCharInformation: KnownCharInformation,
  solutionWords: string[],
): string[] => {
  return solutionWords.filter(word => {
    for (let i = 0; i < word.length; i++) {
      const c = word[i] as string,
        correctChar = correct.get(i),
        wrongChars = wrong.get(i);
      if (correctChar === c) continue; // Handle duplicates
      if ((wrongChars && wrongChars.has(c)) || (correctChar && correctChar !== c)) {
        return false;
      }
    }
    // make a map of non correct chars
    const charCountTable = new Map();
    for (const c of word) {
      incCountTable(charCountTable, c);
    }
    // check that word contains all the needed chars
    // other than the ones which are correct
    return isKnownCharInformationSubset(charCountTable, knownCharInformation);
  });
};
