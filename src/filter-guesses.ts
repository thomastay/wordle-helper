import { incCountTable, PositionMap, KnownCharInformation } from "./common";
import { isKnownCharInformationSubset } from "./compile-guesses";

export function sortAndFilterGuesses(
  correct: PositionMap<string>,
  wrong: PositionMap<Set<string>>,
  knownCharInformation: KnownCharInformation,
  solutionWords: string[],
  limit: number,
): string[] {
  const filtered = filterGuesses(correct, wrong, knownCharInformation, solutionWords);
  sortSuggestions(filtered);
  return filtered.slice(0, limit);
}

export function filterGuesses(
  correct: PositionMap<string>,
  wrong: PositionMap<Set<string>>,
  knownCharInformation: KnownCharInformation,
  solutionWords: string[],
): string[] {
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
}

export function sortSuggestions(suggestions: string[]): void {
  suggestions.sort((s1, s2) => {
    const size1 = new Set(Array.from(s1)).size;
    const size2 = new Set(Array.from(s2)).size;
    if (size1 === size2) {
      const score1 = calcScore(s1);
      const score2 = calcScore(s2);
      return score2 - score1;
    }
    return size2 - size1;
  });
}

export function calcScore(word: string): number {
  const charCodeForLowercaseA = 97;
  /** A to Z */
  const staticWordleFrequencyTable = [
    807, 244, 388, 330, 938, 182, 257, 328, 572, 23, 183, 579, 262, 474, 600, 304, 28, 746, 552, 596, 404, 135, 171, 33,
    367, 31,
  ];
  let score = 1;
  for (let i = 0; i < word.length; i++) {
    const c = word.charCodeAt(i) - charCodeForLowercaseA;
    score *= staticWordleFrequencyTable[c] as number;
  }
  return score;
}
