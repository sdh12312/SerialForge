use serde::{Deserialize, Serialize};
use serialport::{DataBits, FlowControl as SerialFlowControl, Parity as SerialParity, StopBits};

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SerialConfig {
    pub baud_rate: u32,
    pub data_bits: u8,
    pub stop_bits: u8,
    pub parity: Parity,
    pub flow_control: FlowControl,
    pub dtr: bool,
    pub rts: bool,
    pub auto_reconnect: bool,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Parity {
    None,
    Odd,
    Even,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum FlowControl {
    None,
    Software,
    Hardware,
}

impl Default for SerialConfig {
    fn default() -> Self {
        Self {
            baud_rate: 115_200,
            data_bits: 8,
            stop_bits: 1,
            parity: Parity::None,
            flow_control: FlowControl::None,
            dtr: false,
            rts: false,
            auto_reconnect: false,
        }
    }
}

impl SerialConfig {
    pub fn to_data_bits(&self) -> Result<DataBits, String> {
        match self.data_bits {
            5 => Ok(DataBits::Five),
            6 => Ok(DataBits::Six),
            7 => Ok(DataBits::Seven),
            8 => Ok(DataBits::Eight),
            value => Err(format!("不支持的数据位: {value}")),
        }
    }

    pub fn to_stop_bits(&self) -> Result<StopBits, String> {
        match self.stop_bits {
            1 => Ok(StopBits::One),
            2 => Ok(StopBits::Two),
            value => Err(format!("不支持的停止位: {value}")),
        }
    }

    pub fn to_parity(&self) -> SerialParity {
        match self.parity {
            Parity::None => SerialParity::None,
            Parity::Odd => SerialParity::Odd,
            Parity::Even => SerialParity::Even,
        }
    }

    pub fn to_flow_control(&self) -> SerialFlowControl {
        match self.flow_control {
            FlowControl::None => SerialFlowControl::None,
            FlowControl::Software => SerialFlowControl::Software,
            FlowControl::Hardware => SerialFlowControl::Hardware,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{Parity, SerialConfig};

    #[test]
    fn default_serial_config_uses_common_embedded_baud_rate() {
        let config = SerialConfig::default();
        assert_eq!(config.baud_rate, 115_200);
        assert_eq!(config.parity, Parity::None);
    }
}
