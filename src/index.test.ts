/**
 * This test file runs through every solution word, and plays a Game of Wordle
 * with each solution word as the solution. It just uses the top suggestion.
 * The goal is to check that every word is reachable
 */
import { assert, Guess, GuessType, PositionMap, CountTable, incCountTable, mapToObj } from "./common";
import { compileGuesses } from "./compile-guesses";
import { filterGuesses, sortSuggestions } from "./filter-guesses";
import solutionWords from "./solutionWords.json";

function mapToSortedList<T>(m: PositionMap<T>): T[] {
  const keys = [...m.keys()].sort();
  const res = [];
  for (const key of keys) {
    res.push(m.get(key) as T);
  }
  return res;
}

function checkGuess(solutionWord: string, guess: string): Guess {
  const result: PositionMap<[string, number]> = new Map();
  /**
   * Used is a array of booleans, which signify if a letter has been 'used' in the wrong place
   * e.g. if the guess is COLOR and the solution word is AROSE, we want to mark the first O as 'wrong'
   * and the second O as notContained.
   */
  const used = [];
  for (let i = 0; i < solutionWord.length; i++) {
    used.push(false);
  }

  for (let i = 0; i < guess.length; i++) {
    const guessChar = guess[i] as string;
    if (guessChar === solutionWord[i]) {
      result.set(i, [guessChar, GuessType.correct]);
      used[i] = true;
    }
  }
  guessLoop: for (let i = 0; i < guess.length; i++) {
    const guessChar = guess[i] as string;
    if (guessChar !== solutionWord[i]) {
      // Check whether the char exists
      for (let j = 0; j < solutionWord.length; j++) {
        const solutionChar = solutionWord[j];
        if (solutionChar === guessChar && !used[j]) {
          result.set(i, [guessChar, GuessType.wrong]);
          used[j] = true;
          continue guessLoop;
        }
      }
      result.set(i, [guessChar, GuessType.notContained]);
    }
  }
  return mapToSortedList(result);
}

function guessToString(guess: Guess): string {
  return guess.map(([c]) => c).join("");
}

type GuessStats = {
  guessWords: string[];
};

function playWordle(startingWord: string, solutionWord: string): GuessStats {
  const guesses: Guess[] = [];
  let guessWord = startingWord; // nice initial guess
  while (true) {
    guesses.push(checkGuess(solutionWord, guessWord));
    if (guessWord === solutionWord) {
      return {
        guessWords: guesses.map(guessToString),
      };
    }
    const [correct, wrong, knownCharInformation, errors] = compileGuesses(guesses);
    assert(
      errors.every(e => !e),
      "Errors is nonempty",
    );
    const suggestions = filterGuesses(correct, wrong, knownCharInformation, solutionWords);
    sortSuggestions(suggestions);
    if (!suggestions.some(sugg => sugg === solutionWord)) {
      console.log("Suggestions", suggestions);
      throw new Error("Solution word not found in suggestions");
    }
    guessWord = suggestions[0] as string;
  }
}

function playWordleAll(startingWord: string): string {
  const wordsFailed: CountTable<number> = new Map();
  for (const solutionWord of solutionWords) {
    const stats = playWordle(startingWord, solutionWord);
    incCountTable(wordsFailed, stats.guessWords.length);
  }
  return JSON.stringify(mapToObj(wordsFailed));
}

function analyseStartingWords(start: number, end: number): void {
  sortSuggestions(solutionWords);
  const startingWords = solutionWords.slice(start, end);
  console.log("{");
  for (const startingWord of startingWords) {
    const wordsFailedStr = playWordleAll(startingWord);
    console.log(`"${startingWord}": ${wordsFailedStr},`);
    console.error(`${start++} ${startingWord}: ${wordsFailedStr}`);
  }
  // No good way to output this on SIGINT, see https://github.com/nodejs/node/issues/9050
  console.log("}");
}

// TODO a better argv parser pls
const subCommand = process.argv[2];
if (subCommand === "startingWord") {
  analyseStartingWords(Number(process.argv[3]) || 0, Number(process.argv[4]) || solutionWords.length);
} else {
  console.log(playWordleAll("abide"));
}
