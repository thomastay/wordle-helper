import string, json
from collections import Counter
with open("../src/solution-words-alphabetical.json") as f:
    solutionWords = json.load(f)
    freq = Counter()
    for word in solutionWords:
        for c in set(word):
            freq[c] += 1
    in_order_freq = [freq[c] for c in string.ascii_lowercase]
    print(json.dumps(in_order_freq))
