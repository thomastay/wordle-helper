#[derive(Debug)]
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

#[derive(Debug)]
pub struct PositionMapChar([u8; 26]);

impl PositionMapChar {
    const INVALID: u8 = 255;
    pub fn new() -> Self {
        Self([Self::INVALID; 26])
    }

    pub fn insert(&mut self, k: u8, c: u8) {
        assert!(k < 26, "Key out of bounds");
        assert!(c < 26, "Val out of bounds");
        self.0[k as usize] = c;
    }

    pub fn get(&self, k: u8) -> Option<u8> {
        assert!(k < 26, "Key out of bounds");
        let v = self.0[k as usize];
        if v == Self::INVALID {
            None
        } else {
            Some(v)
        }
    }
}
