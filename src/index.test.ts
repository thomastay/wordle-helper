/**
 * This test file runs through every solution word, and plays a Game of Wordle
 * with each solution word as the solution. It just uses the top suggestion.
 * The goal is to check that every word is reachable
 */
import { assert, Guess, GuessType, PositionMap } from "./common";
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
  numSuggestions: number[];
};

function playWordle(startingWord: string, solutionWord: string): GuessStats {
  const guesses: Guess[] = [];
  const numSuggestions: number[] = []; // TODO update stats
  const logGuesses = () => {
    console.log("Guesses:", guesses.map(guessToString));
    console.log("Num Suggestions:", numSuggestions);
  };
  let guessWord = startingWord; // nice initial guess
  while (true) {
    guesses.push(checkGuess(solutionWord, guessWord));
    if (guessWord === solutionWord) {
      numSuggestions.push(1); // answer!
      return {
        guessWords: guesses.map(guessToString),
        numSuggestions,
      };
    }
    const [correct, wrong, knownCharInformation, errors] = compileGuesses(guesses);
    assert(
      errors.every(e => !e),
      "Errors is nonempty",
    );
    const suggestions = filterGuesses(correct, wrong, knownCharInformation, solutionWords);
    sortSuggestions(suggestions);
    numSuggestions.push(suggestions.length);
    if (!suggestions.some(sugg => sugg === solutionWord)) {
      logGuesses();
      console.log("Suggestions", suggestions);
      throw new Error("Solution word not found in suggestions");
    }
    guessWord = suggestions[0] as string;
  }
}

function playWordleAll(startingWord: string): void {
  for (const solutionWord of solutionWords) {
    playWordle(startingWord, solutionWord);
  }
}

function analyseStartingWords(): void {
  const allSolutions = solutionWords.slice(0); // don't alter the global
  sortSuggestions(allSolutions);
  const startingWords = allSolutions.slice(0, 50);
  for (const startingWord of startingWords) {
    console.log("Starting with", startingWord);

    // const countsOfNumGuesses: CountTable<number> = new Map();
    let numWordsFailed = 0;
    // const wordsFailed: [string, string[]][] = [];
    for (const solutionWord of solutionWords) {
      // console.log(`Playing ${solutionWord}`);
      const stats = playWordle(startingWord, solutionWord);
      // incCountTable(countsOfNumGuesses, stats.guessWords.length);
      if (stats.guessWords.length > 6) {
        numWordsFailed++;
        // wordsFailed.push([solutionWord, stats.guessWords]);
      }
    }
    // console.log(sortedCountTable(countsOfNumGuesses));
    console.log("Words failed: ", numWordsFailed);
  }
}

if (process.argv[2] === "startingWord") {
  analyseStartingWords();
} else {
  playWordleAll("alert");
}
