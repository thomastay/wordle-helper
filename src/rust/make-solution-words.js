import solutionWords from "../solutionWords.json" assert { type: "json" };
import { writeFileSync } from "node:fs";
const charCodeForLowercaseA = 97;

// Convert each solution word into a u32 value

function toU32(word) {
  let res = 0;
  for (let i = 0; i < word.length; i++) {
    res = res * 26 + (word.charCodeAt(i) - charCodeForLowercaseA);
  }
  return res;
}

/*
    pub fn score(self) -> u32 {
        // step1: each letter is static_table[i]
        // step2: the number of distinct letters is distinct * 26^5
        let mut score: u32 = 1;
        let mut char_set = HashSet::new();
        for c in self.to_guess_str() {
            char_set.insert(c);
            let freq = STATIC_WORDLE_FREQUENCY_TABLE[c as usize];
            score *= freq;
        }
        // add distinct letters
        score + u32::pow(26, 5) * char_set.len() as u32
    }
*/
// TODO make this similar to calcScore
function score(word) {
  const STATIC_WORDLE_FREQUENCY_TABLE= [
      807, 244, 388, 330, 938, 182, 257, 328, 572, 23, 183, 579, 262, 474, 600, 304, 28, 746, 552,
      596, 404, 135, 171, 33, 367, 31,
  ];
  const charSet = new Set();
  let score = 1;
  for (let i = 0; i < word.length; i++) {
    const c = word.charCodeAt(i) - charCodeForLowercaseA;
    score *= STATIC_WORDLE_FREQUENCY_TABLE[c];
    charSet.add(c);
  }
  score += 342269084820807 * charSet.size;
  return score
}

function toWordleWordNewtype(num) {
  return `WordleWord(${num})`;
}

const solutionWordsU32 = solutionWords.map(toU32).map(toWordleWordNewtype);
const solutionWordsScore = solutionWords.map(score);

const outFileName = process.argv[2];
writeFileSync(outFileName,`\
//! Auto generated by make-solution-words.js
//! Do not edit.

use crate::WordleWord;

/// List of wordle solution words
pub const SOLUTION_WORDS: [WordleWord; ${solutionWords.length}] = [${solutionWordsU32}];

pub const SOLUTION_WORDS_SCORE: [u64; ${solutionWords.length}] = [${solutionWordsScore}];
`
);
