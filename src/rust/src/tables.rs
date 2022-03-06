use fixedbitset::FixedBitSet;

const NUM_LOWERCASE: u8 = 26;

#[derive(Debug)]
pub struct AsciiCountTable([u8; NUM_LOWERCASE as usize]);

impl AsciiCountTable {
    pub fn new() -> Self {
        Self([0; NUM_LOWERCASE as usize])
    }

    pub fn inc(&mut self, c: u8) {
        assert!(c < NUM_LOWERCASE, "Out of bounds");
        self.0[c as usize] += 1;
    }

    pub fn get(&self, c: u8) -> u32 {
        assert!(c < NUM_LOWERCASE, "Out of bounds");
        self.0[c as usize].into()
    }
}

impl Default for AsciiCountTable {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug)]
pub struct PositionMapChar([u8; NUM_LOWERCASE as usize]);

impl PositionMapChar {
    const INVALID: u8 = 255;
    pub fn new() -> Self {
        Self([Self::INVALID; NUM_LOWERCASE as usize])
    }

    pub fn insert(&mut self, k: u8, c: u8) {
        assert!(k < NUM_LOWERCASE, "Key out of bounds");
        assert!(c < NUM_LOWERCASE, "Val out of bounds");
        self.0[k as usize] = c;
    }

    pub fn get(&self, k: u8) -> Option<u8> {
        assert!(k < NUM_LOWERCASE, "Key out of bounds");
        let v = self.0[k as usize];
        if v == Self::INVALID {
            None
        } else {
            Some(v)
        }
    }
}

#[derive(Debug)]
pub struct PositionWrongChars(FixedBitSet);

impl PositionWrongChars {
    pub fn new() -> Self {
        let n: usize = NUM_LOWERCASE.into();
        Self(FixedBitSet::with_capacity(n * n))
    }

    pub fn insert(&mut self, k: u8, c: u8) {
        assert!(k < NUM_LOWERCASE, "Key out of bounds");
        assert!(c < NUM_LOWERCASE, "Val out of bounds");
        let k: usize = k.into();
        let c: usize = c.into();
        self.0.insert(k * usize::from(NUM_LOWERCASE) + c);
    }

    pub fn contains(&self, k: u8, c: u8) -> bool {
        assert!(k < NUM_LOWERCASE, "Key out of bounds");
        assert!(c < NUM_LOWERCASE, "Val out of bounds");
        let k: usize = k.into();
        let c: usize = c.into();
        self.0[k * usize::from(NUM_LOWERCASE) + c]
    }
}
