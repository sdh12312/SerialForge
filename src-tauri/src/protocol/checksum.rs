pub fn sum8(data: &[u8]) -> u8 {
    data.iter().fold(0_u8, |acc, byte| acc.wrapping_add(*byte))
}

pub fn sum16(data: &[u8]) -> u16 {
    data.iter()
        .fold(0_u16, |acc, byte| acc.wrapping_add(u16::from(*byte)))
}

pub fn xor8(data: &[u8]) -> u8 {
    data.iter().fold(0_u8, |acc, byte| acc ^ *byte)
}

pub fn crc16_modbus(data: &[u8]) -> u16 {
    let mut crc = 0xFFFF_u16;

    for byte in data {
        crc ^= u16::from(*byte);
        for _ in 0..8 {
            if crc & 0x0001 != 0 {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }

    crc
}

pub fn crc16_ccitt_false(data: &[u8]) -> u16 {
    let mut crc = 0xFFFF_u16;

    for byte in data {
        crc ^= u16::from(*byte) << 8;
        for _ in 0..8 {
            if crc & 0x8000 != 0 {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
        }
    }

    crc
}

#[cfg(test)]
mod tests {
    use super::{crc16_ccitt_false, crc16_modbus, sum16, sum8, xor8};

    #[test]
    fn calculates_simple_checksums() {
        let data = [0x01, 0x02, 0x03, 0xFF];
        assert_eq!(sum8(&data), 0x05);
        assert_eq!(sum16(&data), 0x0105);
        assert_eq!(xor8(&data), 0xFF);
    }

    #[test]
    fn calculates_standard_crc_vectors() {
        let vector = b"123456789";
        assert_eq!(crc16_modbus(vector), 0x4B37);
        assert_eq!(crc16_ccitt_false(vector), 0x29B1);
    }
}
