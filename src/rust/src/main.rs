use std::fmt;
use wordle_helper::play_wordle;
use wordle_helper::solution_words::SOLUTION_WORDS;

use rayon::prelude::*;

const MAX_GUESSES: usize = 16;
#[derive(Debug)]
struct FixedCountTable([u32; MAX_GUESSES]);

impl FixedCountTable {
    pub fn new() -> Self {
        Self([0; MAX_GUESSES])
    }

    pub fn inc(&mut self, num_guesses: u8) {
        let n: usize = usize::from(num_guesses);
        assert!(n < MAX_GUESSES, "exceeded max guesses");
        self.0[n] += 1;
    }
}
impl fmt::Display for FixedCountTable {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self.0)
    }
}

fn main() {
    let res = SOLUTION_WORDS
        .par_iter()
        .map(|&starting_word| {
            let mut t = FixedCountTable::new();
            for word in SOLUTION_WORDS {
                let num_guesses = play_wordle(starting_word, word).num_guesses;
                t.inc(num_guesses.try_into().expect("Less than 26 guesses"));
            }
            t
        })
        .collect::<Vec<_>>();
    println!("{{");
    for (i, t) in res.iter().enumerate() {
        // No commas on last line
        if i == res.len() - 1 {
            println!("\"{}\": {}", SOLUTION_WORDS[i], t);
        } else {
            println!("\"{}\": {},", SOLUTION_WORDS[i], t);
        }
    }
    println!("}}");
}
