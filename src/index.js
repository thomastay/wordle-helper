"use strict";
import solutionWords from "./solutionWords.json";
import { GuessType, isAlpha, incCountTable, NERDY_DECIMAL_LEN } from "./common";
import { makeSuggestionNode, makeDOMElt, makeParagraph, NUM_SUGGESTIONS } from "./common-dom";
import {
  compileGuesses,
  isKnownCharInformationSubset,
  knownCharInformationToStrings,
  correctToString,
  wrongToString,
} from "./compile-guesses";
import { sortAndFilterGuesses, calcScore } from "./filter-guesses";

const params = new URLSearchParams(document.location.search);
const showStats = params.get("showStats");

window.suggestStartingWord = () => {
  // computed by tools/analyze-wordle.js, which in turns is using src/index.test.ts startingWord --json
  const goodStartingWordsIndices = [
    // best to get 2 or 3
    411, // crane
    415, // crate
    855, // heart
    1215, // parse
    1567, // slate
    1848, // trace
    1848, // trace
    1853, // train
    // best not to fail
    1315, // psalm
    1503, // shank
    1668, // spunk
    1683, // stamp
    1710, // stomp
  ];

  const currStartingWordIndex = Math.floor(Math.random() * goodStartingWordsIndices.length);
  const suggestedStartingWordElement = document.getElementById("suggested-starting-word");
  suggestedStartingWordElement.innerHTML = "";
  // suggestedStartingWordElement.appendChild(makeParagraph(`✨ Happy birthday honey! ❤️✨`));
  suggestedStartingWordElement.appendChild(
    makeParagraph(
      `Try starting with: ${solutionWords[goodStartingWordsIndices[[currStartingWordIndex]]].toUpperCase()}`,
    ),
  );
};

window.demo = (demoStr1, demoStr2) => {
  let didPrompt = false; // only prompt once
  for (let i = 1; i <= 6; i++) {
    // Clean out errors
    const currValue = document.getElementById(`input${i}`).value;
    if (currValue && !didPrompt) {
      if (!window.confirm("Warning: This will override your current guesses. Continue?")) {
        return;
      } else {
        didPrompt = true;
      }
    }
    document.getElementById(`error${i}`).innerHTML = "";
    document.getElementById(`input${i}`).value = "";
  }
  document.getElementById(`input1`).value = demoStr1;
  document.getElementById(`input2`).value = demoStr2;
  window.update();
};

window.update = isFirstLoad => {
  const updateStartTime = performance.now();
  const guesses = [];
  for (let i = 1; i <= 6; i++) {
    // Clean out errors
    document.getElementById(`error${i}`).innerHTML = "";
    guesses.push(document.getElementById(`input${i}`).value);
  }
  if (isFirstLoad && guesses.every(g => !g)) {
    // empty first load, no need to continue;
    return;
  }
  // The guess is parsed into a pair of (char, GuessType)
  // -------- Parse guesses -----------------
  const parsedGuesses = guesses
    .map(g => g.toLowerCase())
    .map((guess, guessNum) => {
      // regular char is discarded, correct char is succeeded by a period, correct but reordered by a comma
      let parsedGuess = [];
      for (let i = 0; i < guess.length; i++) {
        const c = guess[i];
        if (!isAlpha(c)) {
          document.getElementById(
            `error${guessNum + 1}`,
          ).innerHTML += `The inputted char ${c} is not a character from A-Z. `;
          throw new Error("Invalid Input at guess " + guessNum + ", unable to continue");
        }
        if (i + 1 < guess.length) {
          switch (guess[i + 1]) {
            case ".":
              parsedGuess.push([c, GuessType.correct]);
              i++;
              continue;
            case ",":
              parsedGuess.push([c, GuessType.wrong]);
              i++;
              continue;
            default:
            // do nothing, fallthrough;
          }
        }
        parsedGuess.push([c, GuessType.notContained]);
      }
      if (parsedGuess.length > 0 && parsedGuess.length < 5) {
        document.getElementById(`error${guessNum + 1}`).innerHTML += `Too few characters. `;
      } else if (parsedGuess.length > 5) {
        document.getElementById(`error${guessNum + 1}`).innerHTML += `Too many characters. `;
      }
      return parsedGuess;
    });

  // Build the contains, wrong, and count tables from the guesses
  const [correct, wrong, knownCharInformation, errors] = compileGuesses(parsedGuesses);
  errors.forEach((errStr, i) => {
    if (errStr) document.getElementById(`error${i + 1}`).innerHTML += errStr;
  });

  // -------- Filter out all valid words meeting the conditions above  ------------
  const suggestionsRootElement = document.getElementById("suggestions");
  const afterSuggestionsElement = document.getElementById("afterSuggestions");
  afterSuggestionsElement.innerHTML = "";
  const [suggestions, numFilteredTotal] = sortAndFilterGuesses(
    correct,
    wrong,
    knownCharInformation,
    solutionWords,
    NUM_SUGGESTIONS,
  );

  // -------- Sort and display it to the screen -----------
  let maxScore = 0;

  if (showStats) {
    for (const s of suggestions) {
      const score = calcScore(s);
      if (score > maxScore) maxScore = score;
    }
  }
  const suggestionsNodes = suggestions.map(s => makeSuggestionNode(s, showStats, maxScore));
  if (numFilteredTotal > suggestions.length) {
    afterSuggestionsElement.append(makeParagraph(`(${suggestions.length} out of ${numFilteredTotal} words shown)`));
  }
  if (showStats) {
    const updateTime = performance.now() - updateStartTime;
    afterSuggestionsElement.append(makeParagraph(`Rendered in ${updateTime.toFixed(NERDY_DECIMAL_LEN)} ms`));
    afterSuggestionsElement.append(makeDOMElt("h3", `Known Char info:`));
    afterSuggestionsElement.append(makeParagraph(`Correct: ${correctToString(correct)}`));
    afterSuggestionsElement.append(makeParagraph(`Wrong: ${wrongToString(wrong)}`));

    knownCharInformationToStrings(knownCharInformation).forEach(kciStr =>
      afterSuggestionsElement.append(makeParagraph(kciStr)),
    );
  }
  suggestionsRootElement.replaceChildren(...suggestionsNodes);
};
window.onload = () => update(true);
