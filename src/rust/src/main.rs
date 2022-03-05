use wordle_helper::play_wordle;
use wordle_helper::solution_words::SOLUTION_WORDS;

fn main() {
    let starting_word = SOLUTION_WORDS[0];
    for word in SOLUTION_WORDS {
        println!(
            "Playing {} - num guesses {}",
            word,
            play_wordle(starting_word, word).num_guesses
        );
    }
}
