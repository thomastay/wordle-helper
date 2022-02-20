/**
 * This test file runs through every solution word, and plays a Game of Wordle
 * with each solution word as the solution. It just uses the top suggestion.
 * The goal is to check that every word is reachable
 */
import { assert, Guess, GuessType } from "./common";
import { compileGuesses } from "./compile-guesses";
import { filterGuesses, sortSuggestions } from "./filter-guesses";
import solutionWords from "./solutionWords.json";

function checkGuess(solutionWord: string, guess: string): Guess {
  const result: Guess = [];
  /**
   * Used is a array of booleans, which signify if a letter has been 'used' in the wrong place
   * e.g. if the guess is COLOR and the solution word is AROSE, we want to mark the first O as 'wrong'
   * and the second O as notContained.
   */
  const used = [];
  for (let i = 0; i < solutionWord.length; i++) {
    used.push(false);
  }

  guessLoop: for (let i = 0; i < guess.length; i++) {
    const guessChar = guess[i] as string;
    if (guessChar === solutionWord[i]) {
      result.push([guessChar, GuessType.correct]);
    } else {
      // Check whether the char exists
      for (let j = 0; j < solutionWord.length; j++) {
        const solutionChar = solutionWord[j];
        if (solutionChar === guessChar && !used[j]) {
          result.push([guessChar, GuessType.wrong]);
          used[j] = true;
          continue guessLoop;
        }
      }
      result.push([guessChar, GuessType.notContained]);
    }
  }
  return result;
}

function guessToString(guess: Guess): string {
  return guess.map(([c]) => c).join("");
}

function playWordle(solutionWord: string): void {
  const guesses: Guess[] = [];
  const guessStats = [2047]; // TODO update stats
  const logGuesses = () => {
    console.log("Guesses:", guesses.map(guessToString));
    console.log("Guess stats:", guessStats);
  };
  let guessWord = "arose"; // nice initial guess
  while (true) {
    guesses.push(checkGuess(solutionWord, guessWord));
    if (guessWord === solutionWord) {
      logGuesses();
      return;
    }
    const [correct, wrong, knownCharInformation, errors] = compileGuesses(guesses);
    assert(
      errors.every(e => !e),
      "Errors is nonempty",
    );
    const suggestions = filterGuesses(correct, wrong, knownCharInformation, solutionWords);
    sortSuggestions(suggestions);
    guessStats.push(suggestions.length);
    if (!suggestions.some(sugg => sugg === solutionWord)) {
      logGuesses();
      console.log("Suggestions", suggestions);
      throw new Error("Solution word not found in suggestions");
    }
    guessWord = suggestions[0] as string;
  }
}

for (const solutionWord of solutionWords) {
  console.log(`Playing ${solutionWord}`);
  playWordle(solutionWord);
}
