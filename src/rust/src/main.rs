use wordle_helper::play_wordle;
use wordle_helper::solution_words::SOLUTION_WORDS;
use std::fmt;

use rayon::prelude::*;

const MAX_GUESSES: usize = 32;
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
        // TODO (angtay): use Miniserde or something instead of this shitty JSON stringify
        /* f.write_str("{")?;
        let mut first = true;
        for i in 0..MAX_GUESSES {
            let v = self.0[i];
            if v > 0 {
                if first {
                    write!(f, "\"{}\": {}", i, v)?;
                } else {
                    write!(f, ", \"{}\": {}", i, v)?;
                }
                first = false;
            }
        }
        f.write_str("}") */
    }
}

fn main() {
    let res = SOLUTION_WORDS.par_iter().map(|&starting_word| {
        let mut t = FixedCountTable::new();
        for word in SOLUTION_WORDS {
            let num_guesses = play_wordle(starting_word, word).num_guesses;
            t.inc(num_guesses.try_into().expect("Less than 26 guesses"));
        }
        t
    }).collect::<Vec<_>>();
    for (i, t) in res.iter().enumerate() {
        println!(
            "\"{}\": {},",
            SOLUTION_WORDS[i],
            t
        );
    }
}
