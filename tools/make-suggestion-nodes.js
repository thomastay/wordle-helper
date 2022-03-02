import { makeSuggestionNodeHTML, NUM_SUGGESTIONS } from "../src/common-dom";
import { sortSuggestions } from "../src/filter-guesses";
import solutionWords from "../src/solutionWords.json";
import { writeFileSync } from "node:fs";

const suggestionsFilename = process.argv[2];
const afterSuggestionsFilename = process.argv[3];

sortSuggestions(solutionWords);
const html = solutionWords.slice(0, NUM_SUGGESTIONS).map(makeSuggestionNodeHTML).join("");
writeFileSync(suggestionsFilename, html);
writeFileSync(afterSuggestionsFilename, `(${NUM_SUGGESTIONS} out of ${solutionWords.length} words shown)`);
