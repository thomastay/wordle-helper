"use strict";
import solutionWords from "./solutionWords.json";
import { GuessType, isAlpha, incCountTable } from "./common";
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

// computed by tools/analyze-wordle.js, which in turns is using src/index.test.ts startingWord --json
const goodStartingWordsIndices = [
  1263, 1650, 1363, 1683, 1315, 1268, 1641, 361, 435, 1462, 674, 1635, 1294, 2031, 192, 1464, 1663, 1262, 185, 1470,
  1458, 1206, 1640, 1755, 1209, 449, 552, 239, 445, 1744, 1269, 677, 144, 1986, 1307, 1658,
];

let currStartingWordIndex = Math.floor(Math.random() * goodStartingWordsIndices.length);

window.suggestStartingWord = () => {
  const suggestedStartingWordElement = document.getElementById("suggested-starting-word");
  suggestedStartingWordElement.innerHTML = "";
  suggestedStartingWordElement.appendChild(
    makeDOMElt("p", `Try starting with: ${solutionWords[goodStartingWordsIndices[[currStartingWordIndex]]]}`),
  );
  currStartingWordIndex = (currStartingWordIndex + 1) % goodStartingWordsIndices.length;
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
  if (demoStr2) document.getElementById(`input2`).value = demoStr2;
  window.update();
};

window.update = () => {
  const updateStartTime = performance.now();
  const guesses = [];
  for (let i = 1; i <= 6; i++) {
    // Clean out errors
    document.getElementById(`error${i}`).innerHTML = "";
    guesses.push(document.getElementById(`input${i}`).value);
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
    200,
  );

  // -------- Sort and display it to the screen -----------
  let maxScore = 0;

  if (showStats) {
    for (const s of suggestions) {
      const score = calcScore(s);
      if (score > maxScore) maxScore = score;
    }
  }

  const NERDY_DECIMAL_LEN = 4; // 4 decimal points makes it look super accurate
  const suggestionsNodes = suggestions.map(suggestionText => {
    const n = document.createElement("li");
    if (showStats) {
      n.innerHTML = `${suggestionText} (${(calcScore(suggestionText) / maxScore).toFixed(NERDY_DECIMAL_LEN)})`;
    } else {
      n.innerHTML = suggestionText;
    }

    return n;
  });
  if (numFilteredTotal > suggestions.length) {
    afterSuggestionsElement.append(`(${suggestions.length} out of ${numFilteredTotal} words shown)`);
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

/// DOM operations
function makeDOMElt(type, text) {
  const node = document.createElement(type);
  node.innerHTML = text;
  return node;
}
function makeParagraph(text) {
  return makeDOMElt("p", text);
}
window.onload = update;
