import solutionWords from "../src/solutionWords.json" assert { type: "json" };
import analysis from "./analysis-formatted.json" assert { type: "json" };
const solutionWordsMap = new Map(solutionWords.map((w, i) => [w, i]));

function wordsWithFailure(n) {
  return Object.entries(analysis)
    .filter(([word, c]) => c === n)
    .map(([word]) => solutionWordsMap.get(word));
}

console.log([...wordsWithFailure(5), ...wordsWithFailure(6), ...wordsWithFailure(7)]);
