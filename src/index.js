import solutionWords from "./solutionWords.json";
import { GuessType, isAlpha, incCountTable } from "./common";
import {
  compileGuesses,
  isKnownCharInformationSubset,
  knownCharInformationToStrings,
  correctToString,
  wrongToString,
} from "./compile-guesses";
const params = new URLSearchParams(document.location.search);
const showStats = params.get("showStats");
const NERDY_DECIMAL_LEN = 4; // 4 decimal points makes it look super accurate

window.demo = (demoStr1, demoStr2) => {
  for (let i = 1; i <= 6; i++) {
    // Clean out errors
    const currValue = document.getElementById(`input${i}`).value;
    if (currValue && !window.confirm("Warning: This will override your current guesses. Continue?")) {
      return;
    }
    document.getElementById(`error${i}`).innerHTML = "";
    document.getElementById(`input${i}`).value = "";
  }
  document.getElementById(`input1`).value = demoStr1;
  if (demoStr2) document.getElementById(`input2`).value = demoStr2;
  window.update()
}

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
  const suggestions = solutionWords.filter(word => {
    for (let i = 0; i < word.length; i++) {
      const c = word[i],
        correctChar = correct.get(i),
        wrongChars = wrong.get(i);
      if (correctChar === c) continue; // Handle duplicates
      if ((wrongChars && wrongChars.has(c)) || (correctChar && correctChar !== c)) {
        return false;
      }
    }
    // make a map of non correct chars
    const charCountTable = new Map();
    for (let i = 0; i < word.length; i++) {
      const c = word[i];
      incCountTable(charCountTable, c);
    }
    // check that word contains all the needed chars
    // other than the ones which are correct
    return isKnownCharInformationSubset(charCountTable, knownCharInformation);
  });

  // -------- Sort and display it to the screen -----------
  const limitedSuggestions = suggestions.slice(0, 200);
  limitedSuggestions.sort((s1, s2) => {
    const size1 = new Set(Array.from(s1)).size;
    const size2 = new Set(Array.from(s2)).size;
    if (size1 === size2) {
      const score1 = calcScore(s1);
      const score2 = calcScore(s2);
      return score2 - score1;
    }
    return size2 - size1;
  });
  let maxScore = 0;
  if (showStats) {
    for (const s of suggestions) {
      const score = calcScore(s);
      if (score > maxScore) maxScore = score;
    }
  }

  const suggestionsNodes = limitedSuggestions.map(suggestionText => {
    const n = document.createElement("li");
    if (showStats) {
      n.innerHTML = `${suggestionText} (${(calcScore(suggestionText) / maxScore).toFixed(NERDY_DECIMAL_LEN)})`;
    } else {
      n.innerHTML = suggestionText;
    }

    return n;
  });
  if (suggestions.length > limitedSuggestions.length) {
    afterSuggestionsElement.append(`(${limitedSuggestions.length} out of ${suggestions.length} words shown)`);
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

function calcScore(word) {
  const charCodeForLowercaseA = 97;
  /** A to Z */
  const staticWordleFrequencyTable = [
    807, 244, 388, 330, 938, 182, 257, 328, 572, 23, 183, 579, 262, 474, 600, 304, 28, 746, 552, 596, 404, 135, 171, 33,
    367, 31,
  ];
  let score = 1;
  for (let i = 0; i < word.length; i++) {
    const c = word.charCodeAt(i) - charCodeForLowercaseA;
    score *= staticWordleFrequencyTable[c];
  }
  return score;
}
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
