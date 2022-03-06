#![allow(missing_docs)] // TODO
#![allow(dead_code)] // TODO
#![deny(rust_2018_idioms)]
#![warn(rust_2021_compatibility)]
#![deny(clippy::too_many_arguments)]
#![deny(clippy::complexity)]
#![deny(clippy::perf)]
#![forbid(unsafe_code)]
#![warn(clippy::style)]
#![warn(clippy::pedantic)]
#![allow(clippy::enum_glob_use)]
#![allow(clippy::match_same_arms)]

use std::collections::HashMap;
use std::convert::TryFrom;
use std::fmt;

#[rustfmt::skip]
pub mod solution_words;
mod tables;

use solution_words::{SOLUTION_WORDS, SOLUTION_WORDS_SCORE};
use tables::{AsciiCountTable, PositionMapChar, PositionWrongChars};

const WORDLE_WORD_LEN: usize = 5;

/// We can represent each wordle word as a single 5 digit base 26 number
#[derive(Copy, Clone, PartialEq, Eq)]
pub struct WordleWord(u32);
impl WordleWord {
    /// Returns the char at index i
    /// # Panics
    /// Out of bounds panic
    #[must_use]
    pub fn index(self, i: usize) -> u8 {
        assert!(i < 5, "Index out of bounds");
        let result: u32 = (self.0 / (u32::pow(26, i.try_into().unwrap()))) % 26;
        result
            .try_into()
            .expect("Result modulo 26 must fit into u8")
    }

    #[must_use]
    pub fn to_guess_str(self) -> [u8; WORDLE_WORD_LEN] {
        let mut res = [0; WORDLE_WORD_LEN];
        res[0] = self.index(4);
        res[1] = self.index(3);
        res[2] = self.index(2);
        res[3] = self.index(1);
        res[4] = self.index(0);
        res
    }

    #[must_use]
    pub fn check_against(self, solution: Self) -> Guess {
        let mut result: Guess = [GuessCharType::NotContained(255); WORDLE_WORD_LEN];
        // Used is a array of booleans, which signify if a letter has been 'used' in the wrong place
        // e.g. if the guess is COLOR and the solution word is AROSE, we want to mark the first O as 'wrong'
        // and the second O as notContained.
        let mut used = [false; WORDLE_WORD_LEN];
        let guess_str = self.to_guess_str();
        let solution_str = solution.to_guess_str();

        for (i, c) in guess_str.into_iter().enumerate() {
            if c == solution_str[i] {
                result[i] = GuessCharType::Correct(c);
                used[i] = true;
            }
        }

        'guess_loop: for (i, c) in guess_str.into_iter().enumerate() {
            if c != solution_str[i] {
                // check if the char exists
                for (j, sol_c) in solution_str.into_iter().enumerate() {
                    if sol_c == c && !used[j] {
                        result[i] = GuessCharType::Wrong(c);
                        used[j] = true;
                        continue 'guess_loop;
                    }
                }
                result[i] = GuessCharType::NotContained(c);
            }
        }
        result
    }
}
impl TryFrom<&str> for WordleWord {
    type Error = &'static str;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.len() != 5 {
            return Err("Not five letters");
        }
        let mut x: u32 = 0;
        for c in value.bytes() {
            if !(65..=90).contains(&c) {
                return Err("Not a lowercase letter");
            }
            x = (x * 26) + u32::from(c - b'a');
        }
        Ok(WordleWord(x))
    }
}

const CHARCODE_LOWERCASE_A: u8 = 97;
impl fmt::Display for WordleWord {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // Write strictly the first element into the supplied output
        // stream: `f`. Returns `fmt::Result` which indicates whether the
        // operation succeeded or failed. Note that `write!` uses syntax which
        // is very similar to `println!`.
        write!(
            f,
            "{}{}{}{}{}",
            (self.index(4) + CHARCODE_LOWERCASE_A) as char,
            (self.index(3) + CHARCODE_LOWERCASE_A) as char,
            (self.index(2) + CHARCODE_LOWERCASE_A) as char,
            (self.index(1) + CHARCODE_LOWERCASE_A) as char,
            (self.index(0) + CHARCODE_LOWERCASE_A) as char,
        )
    }
}
impl fmt::Debug for WordleWord {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        // use the Display trait
        write!(f, "{}", self)
    }
}

type PositionMap<T> = HashMap<u8, T>;

/// Maps a guess type --> char
#[derive(Debug, Copy, Clone)]
pub enum GuessCharType {
    NotContained(u8),
    Wrong(u8),
    Correct(u8),
}
pub type Guess = [GuessCharType; WORDLE_WORD_LEN];

#[derive(Debug, Clone)]
pub enum CharInformation {
    NotContained,
    Min(u32),
    Exactly(u32),
}

#[derive(Debug)]
pub struct KnownCharInformation(HashMap<u8, CharInformation>);
impl KnownCharInformation {
    #[must_use]
    pub fn new() -> Self {
        Self(HashMap::new())
    }
    pub fn inc(&mut self, c: u8) {
        match self.0.get_mut(&c) {
            None => {
                self.0.insert(c, CharInformation::Min(1));
            }
            Some(ci) => {
                use CharInformation::*;
                match ci {
                    NotContained => {
                        self.0.insert(c, CharInformation::Min(1));
                    }
                    Min(v) => *v += 1,
                    Exactly(v) => *v += 1,
                }
            }
        }
    }

    /// Merges other into self.
    pub fn merge(&mut self, guess_info: &Self) {
        for (c, char_info) in &guess_info.0 {
            if let Some(curr_char_info) = self.0.get_mut(c) {
                // If gcki has info and kci does too, merge it correctly
                use CharInformation::*;
                match (&curr_char_info, char_info) {
                    (NotContained, _) => {}
                    // TODO add error logging to this case
                    (Exactly(_), _) => {}
                    (Min(_), NotContained) => {}
                    (Min(x), Min(y)) => {
                        if *y > *x {
                            *curr_char_info = Min(*y);
                        }
                    }
                    (Min(_), Exactly(y)) => {
                        *curr_char_info = Exactly(*y);
                    }
                }
            } else {
                // Just directly transfer it in.
                self.0.insert(*c, char_info.clone());
            }
        }
    }

    #[must_use]
    pub fn is_subset_of(&self, other: &AsciiCountTable) -> bool {
        use CharInformation::*;
        for (c, char_info) in &self.0 {
            let count: u32 = other.get(*c);
            match char_info {
                NotContained => {
                    if count > 0 {
                        return false;
                    }
                }
                Min(v) => {
                    if count < *v {
                        return false;
                    }
                }
                Exactly(v) => {
                    if count != *v {
                        return false;
                    }
                }
            }
        }
        true
    }
}

impl Default for KnownCharInformation {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug)]
pub struct CompileGuessResult {
    correct: PositionMapChar,
    wrong: PositionWrongChars,
    known_char_information: KnownCharInformation,
}

#[must_use]
pub fn compile_guesses(guesses: &[Guess]) -> CompileGuessResult {
    let mut correct = PositionMapChar::new();
    let mut wrong = PositionWrongChars::new();
    let mut known_char_information = KnownCharInformation::new();

    for guess in guesses {
        // Compile guess
        let mut guess_known_char_information = KnownCharInformation::new();

        // Round 1: process correct and wrong chars
        for (pos, gct) in guess.iter().enumerate() {
            use GuessCharType::*;
            let pos: u8 = pos.try_into().expect("Pos should be < 256");
            match *gct {
                // TODO (angtay) deal with overlaps case
                Correct(c) => {
                    correct.insert(pos, c);
                    guess_known_char_information.inc(c);
                }
                Wrong(c) => {
                    wrong.insert(pos, c);
                    guess_known_char_information.inc(c);
                }
                NotContained(c) => {
                    wrong.insert(pos, c);
                }
            }
        }

        // Round 2: process not contained chars and update charinformation
        for gct in guess {
            use GuessCharType::*;
            match gct {
                // TODO (angtay) deal with overlaps case
                Correct(_) => {}
                Wrong(_) => {}
                NotContained(c) => {
                    if let Some(char_info) = guess_known_char_information.0.get_mut(c) {
                        if let CharInformation::Min(x) = char_info {
                            *char_info = CharInformation::Exactly(*x);
                        }
                        // else, noop
                    } else {
                        guess_known_char_information
                            .0
                            .insert(*c, CharInformation::NotContained);
                    }
                }
            }
        }
        known_char_information.merge(&guess_known_char_information);
    }
    CompileGuessResult {
        correct,
        wrong,
        known_char_information,
    }
}

fn is_valid_word(word: WordleWord, guesses: &CompileGuessResult) -> bool {
    let mut char_count_table = AsciiCountTable::new();
    for (i, c) in word.to_guess_str().into_iter().enumerate() {
        let i: u8 = i.try_into().unwrap(); // populate char count table
        char_count_table.inc(c);

        if let Some(correct_char) = guesses.correct.get(i) {
            if correct_char == c {
                continue;
            }
            return false;
        }
        if guesses.wrong.contains(i, c) {
            return false;
        }
    }
    guesses
        .known_char_information
        .is_subset_of(&char_count_table)
}

pub struct PlayStats {
    pub num_guesses: usize,
}

/// # Panics
/// Panics if the solution word is not found in the suggestions
#[must_use]
pub fn play_wordle(mut guess_word: WordleWord, solution: WordleWord) -> PlayStats {
    let max_guesses = 12; // in case of infinite loop
    let mut guesses = Vec::new();
    let mut suggestions: Vec<(usize, WordleWord)> =
        SOLUTION_WORDS.iter().copied().enumerate().collect();
    loop {
        guesses.push(guess_word.check_against(solution));
        if guess_word == solution || guesses.len() > max_guesses {
            return PlayStats {
                num_guesses: guesses.len(),
            };
        }
        let compile_guesses_result = compile_guesses(&guesses);
        suggestions.retain(|&(_, w)| is_valid_word(w, &compile_guesses_result));
        assert!(
            suggestions.iter().any(|&(_, w)| w == solution),
            "solution word not found in suggestions {:?}",
            suggestions
        );

        let (_, g) = *suggestions
            .iter()
            .max_by_key(|(i, _)| SOLUTION_WORDS_SCORE[*i])
            .expect("suggestions must be nonempty");
        guess_word = g;
    }
}

/// ------------ Tests --------------

#[cfg(test)]
mod tests {
    #[test]
    fn wordle_iterator() {
        assert_eq!(2 + 2, 4);
    }
}
