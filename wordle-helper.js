function update() {
  const guesses = []
  for (let i = 1; i <= 6; i++) {
    // Clean out errors
    document.getElementById(`error${i}`).innerHTML = "";
    guesses.push(document.getElementById(`input${i}`).value);
  }
  /* Map of position to char */
  const correct = new Map();
  const wrong = new Map();
  const notContained = new Set();
  /** Map of char to count */
  const contained = new Map();

  // -------- Parse guesses -----------------
  guesses.map(g => g.toLowerCase()).forEach((guess, guessNum) => {
    // regular char is discarded, correct char is succeeded by a period, correct but reordered by a comma
    let pos = 0;
    for (let i = 0; i < guess.length; i++, pos++) {
      const guessElement = document.getElementById(`error${guessNum+1}`);
      if (!isAlpha(guess[i])) {
        guessElement.innerHTML = `The inputted char ${guess[i]} is not a character from A-Z. `;
        return;
      }
      if (pos >= 5) {
        guessElement.innerHTML += `Too many guesses`;
        return;
      }
      let prevCorr;
      if (i + 1 < guess.length) {
        switch (guess[i+1]) {
          case '.':
            if ((prevCorr = correct.get(pos)) && prevCorr !== guess[i]) {
              guessElement.innerHTML += `Correct letter ${guess[i]} in position ${pos+1} conflicts with previous correct letter ${correct.get(pos)}. Overwriting. `;
            }
            if (notContained.has(guess[i])) {
              guessElement.innerHTML += `Correct letter ${guess[i]} in position ${pos+1} conflicts with previous not contained letter. Overwriting. `;
              notContained.delete(guess[i]);
            }
            correct.set(pos, guess[i++]);
            continue;
          case ',':
            if (correct.has(pos)) {
              guessElement.innerHTML += `Wrong letter ${guess[i]} in position ${pos+1} conflicts with previous correct letter ${correct.get(pos)}. Overwriting. `;
              correct.delete(pos);
            }
            if (notContained.has(guess[i])) {
              guessElement.innerHTML += `Wrong letter ${guess[i]} in position ${pos+1} conflicts with previous not contained letter. Overwriting. `;
              notContained.delete(guess[i]);
            }
            wrong.set(pos, guess[i]);
            incCountTable(contained, guess[i++]);
            continue;
          default:
            // do nothing, fallthrough;
        }
      }
      if (correct.has(pos)) {
        guessElement.innerHTML += `Not contained letter ${guess[i]} in position ${pos+1} conflicts with previous correct letter ${correct.get(pos)}. Overwriting. `;
      }
      notContained.add(guess[i]);
    }
    if (pos > 0 && pos < 5) {
      document.getElementById(`error${guessNum+1}`).innerHTML += `Too few characters. `;
      return;
    }
  });

  // -------- Give valid  ------------
  const suggestionsRootElement = document.getElementById("suggestions");
  let suggestions = solutionWords.filter(word => {
    for (let i = 0; i < word.length; i++) {
      const 
        c = word[i],
        correctChar = correct.get(i),
        wrongChar = wrong.get(i);
      if (correctChar === c) continue; // Handle duplicates
      if (
        notContained.has(c) ||
        (wrongChar === c) ||
        (correctChar && correctChar !== c)
      ) {
        return false;
      }
    }
    // make a map of non correct chars
    const nonCorrectCharsCountTable = new Map();
    for (let i = 0; i < word.length; i++) {
      const 
        c = word[i],
        correctChar = correct.get(i);
      if (!correctChar) {
        incCountTable(nonCorrectCharsCountTable, c);
      }
    }
    // check that word contains all the needed chars
    // other than the ones which are correct
    return isSubset(contained, nonCorrectCharsCountTable);
  });
  suggestions = suggestions.slice(0, 200);
  suggestions.sort((s1, s2) => {
    const size1 = (new Set(Array.from(s1))).size;
    const size2 = (new Set(Array.from(s2))).size;
    return size2 - size1;
  });
  const suggestionsNodes = suggestions.map(suggestionText => {
    const n = document.createElement("li");
    n.innerHTML = suggestionText;
    return n;
  });
  suggestionsRootElement.replaceChildren(...suggestionsNodes);
}
function assert(ok, message) {
  if (!ok) throw new Error(message);
}
function isAlpha(str) {
  var code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (
      !(code > 64 && code < 91) && // upper alpha (A-Z)
      !(code > 96 && code < 123)) { // lower alpha (a-z)
      return false;
    }
  }
  return true;
};
// --- count tables ---
function incCountTable(m, c) {
  let res;
  if (res = m.get(c)) {
    m.set(c, res + 1);
  } else {
    m.set(c, 1);
  }
}
/** Whether m1 is a subset of m2 */
function isSubset(m1, m2) {
  for (const [k, v] of m1) {
    let m2Val;
    if (m2Val = m2.get(k)) {
      if (m2Val < v) {
        return false;
      }
    } else {
      return false;
    }
  }
  return true;
}
window.onload = update;
