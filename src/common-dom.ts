export const makeSuggestionNode = (suggestion: string): HTMLElement => {
  const n = document.createElement("li");
  n.innerHTML = suggestion;
  return n;
};

// keep in sync with makeSuggestionNode above
export const makeSuggestionNodeHTML = (suggestion: string): string => {
  // <li> elements can be omitted if immediately followed by another <li> tag
  return `<li>${suggestion}`;
};

export const NUM_SUGGESTIONS = 100;

export const makeDOMElt = (type: string, text: string) => {
  const node = document.createElement(type);
  node.innerHTML = text;
  return node;
};

export const makeParagraph = (text: string) => {
  return makeDOMElt("p", text);
};
