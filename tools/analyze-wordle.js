import solutionWords from "../src/solutionWords.json" assert { type: "json" };
import analysis from "./analysis.json" assert { type: "json" };
const solutionWordsMap = new Map(solutionWords.map((w, i) => [w, i]));

// returns a list of [word, number of words that are > n] with strategy
function numGreaterThan(n) {
  return Object.entries(analysis).map(([word, numTakenArr]) => {
    const arr = numTakenArr.slice(n + 1);
    const sum = arr.reduce((acc, x) => acc + x);
    return [word, sum];
  });
}
function findBestGreaterThan(n) {
  return numGreaterThan(n)
    .sort(([_a, b], [_a2, b2]) => b - b2)
    .slice(0, 5);
}

for (let i = 2; i <= 6; i++) {
  console.log("Greater than " + i);
  let bestGreaterThan = findBestGreaterThan(i);
  bestGreaterThan = bestGreaterThan.map(([w, n]) => `${solutionWordsMap.get(w)}, // ${w} (${n})`);
  console.log(bestGreaterThan);
}
