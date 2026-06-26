use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VirtualLinkConfig {
    pub fixed_delay_ms: u64,
    pub random_delay_ms: u64,
    pub packet_loss_rate: f32,
    pub duplicate_rate: f32,
    pub corrupt_rate: f32,
    pub paused: bool,
}

impl Default for VirtualLinkConfig {
    fn default() -> Self {
        Self {
            fixed_delay_ms: 0,
            random_delay_ms: 0,
            packet_loss_rate: 0.0,
            duplicate_rate: 0.0,
            corrupt_rate: 0.0,
            paused: false,
        }
    }
}
