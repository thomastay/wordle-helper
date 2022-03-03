import { NERDY_DECIMAL_LEN } from "./common";
import { calcScore } from "./filter-guesses";

export function makeSuggestionNode(suggestion: string, showStats: boolean, maxScore: number): HTMLElement {
  const n = document.createElement("li");
  if (showStats) {
    n.innerHTML = `${suggestion} (${(calcScore(suggestion) / maxScore).toFixed(NERDY_DECIMAL_LEN)})`;
  } else {
    n.innerHTML = suggestion;
  }
  return n;
}

// keep in sync with makeSuggestionNode above
export function makeSuggestionNodeHTML(suggestion: string): string {
  // <li> elements can be omitted if immediately followed by another <li> tag
  return `<li>${suggestion}`;
}

export const NUM_SUGGESTIONS = 100;

export function makeDOMElt(type: string, text: string) {
  const node = document.createElement(type);
  node.innerHTML = text;
  return node;
}

export function makeParagraph(text: string) {
  return makeDOMElt("p", text);
}
