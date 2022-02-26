#![allow(missing_docs)] // TODO
#![allow(dead_code)] // TODO
#![deny(rust_2018_idioms)]
#![deny(clippy::too_many_arguments)]
#![deny(clippy::complexity)]
#![deny(clippy::perf)]
#![forbid(unsafe_code)]
#![warn(clippy::style)]
#![warn(clippy::pedantic)]
#![allow(clippy::enum_glob_use)]
#![allow(clippy::match_same_arms)]

use std::collections::{HashMap, HashSet};

const WORDLE_WORD_LEN: usize = 5;

/// We can represent each wordle word as a single 5 digit base 26 number
pub type WordleWord = i32;
pub type PositionMap<T> = HashMap<u8, T>;

/// Maps a guess type --> char
pub enum GuessCharType {
    NotContained(u8),
    Wrong(u8),
    Correct(u8),
}
pub type Guess = [GuessCharType; WORDLE_WORD_LEN];

#[derive(Clone)]
pub enum CharInformation {
    NotContained,
    Min(i32),
    Exactly(i32),
}

pub struct KnownCharInformation(HashMap<u8, CharInformation>);
impl KnownCharInformation {
    #[must_use]
    pub fn new() -> Self {
        Self(HashMap::new())
    }
    pub fn inc(&mut self, c: u8) {
        match self.0.get_mut(&c) {
            None => { self.0.insert(c, CharInformation::Min(1)); },
            Some(ci) => {
                use CharInformation::*;
                match ci {
                    NotContained => { self.0.insert(c, CharInformation::Min(1)); },
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
                    (NotContained, _) => {},
                    // TODO add error logging to this case
                    (Exactly(_), _) => {},
                    (Min(_), NotContained) => {},
                    (Min(x), Min(y)) => {
                        if *y > *x { *curr_char_info = Min(*y); }
                    },
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
}

impl Default for KnownCharInformation {
    fn default() -> Self {
        Self::new()
    }
}

pub struct CompileGuessResult {
    correct: PositionMap<u8>,
    wrong: PositionMap<HashSet<u8>>,
    known_char_information: KnownCharInformation,
}

#[must_use]
pub fn compile_guesses(guesses: &[Guess]) -> CompileGuessResult {
    let mut correct = HashMap::new();
    let mut wrong = HashMap::new();
    let mut known_char_information = KnownCharInformation::new();

    for (pos, guess) in guesses.iter().enumerate() {
        // Compile guess
        let pos: u8 = pos.try_into().expect("Pos should be < 256");
        let mut guess_known_char_information = KnownCharInformation::new();
        // Round 1: process correct and wrong chars
        for gct in guess {
            use GuessCharType::*;
            match *gct {
                // TODO (angtay) deal with overlaps case
                Correct(c) => {
                    correct.insert(pos, c);
                    guess_known_char_information.inc(c);
                },
                Wrong(c) => {
                    add_to_set(&mut wrong, pos, c);
                    guess_known_char_information.inc(c);
                },
                NotContained(c) => {
                    add_to_set(&mut wrong, pos, c);
                },
            }
        }
        // Round 2: process not contained chars and update charinformation
        for gct in guess {
            use GuessCharType::*;
            match gct {
                // TODO (angtay) deal with overlaps case
                Correct(_) => {},
                Wrong(_) => {},
                NotContained(c) => {
                    if let Some(char_info) = guess_known_char_information.0.get_mut(c) {
                        if let CharInformation::Min(x) = char_info {
                            *char_info = CharInformation::Exactly(*x);
                        }
                        // else, noop
                    } else {
                        guess_known_char_information.0.insert(*c, CharInformation::NotContained);
                    }

                },
            }
        }
        known_char_information.merge(&guess_known_char_information);
    };
    CompileGuessResult {
        correct,
        wrong,
        known_char_information,
    }
}

fn add_to_set(s: &mut PositionMap<HashSet<u8>>, i: u8, c: u8) {
    if let Some(char_set) = s.get_mut(&i) {
        char_set.insert(c);
    } else {
        let mut st = HashSet::new();
        st.insert(c);
        s.insert(i, st);
    }
}
