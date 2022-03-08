import { makeSuggestionNodeHTML, NUM_SUGGESTIONS } from "../src/common-dom";
import solutionWords from "../src/solution-words.json";
import { writeFileSync } from "node:fs";

// argv[0] == "node"
// argv[1] == __FILENAME__
const suggestionsFilename = process.argv[2];
const afterSuggestionsFilename = process.argv[3];

const html = solutionWords.slice(0, NUM_SUGGESTIONS).map(makeSuggestionNodeHTML).join("");
writeFileSync(suggestionsFilename, html);
writeFileSync(afterSuggestionsFilename, `<p>(${NUM_SUGGESTIONS} out of ${solutionWords.length} words shown)</p>`);
