pub struct AsciiCountTable([u8; 26]);

impl AsciiCountTable {
    pub fn new() -> Self {
        Self([0; 26])
    }

    pub fn inc(&mut self, c: u8) {
        assert!(c < 26, "Out of bounds");
        self.0[c as usize] += 1;
    }

    pub fn get(&self, c: u8) -> u32 {
        assert!(c < 26, "Out of bounds");
        self.0[c as usize].into()
    }
}
