use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AutoResponseRule {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub match_mode: String,
    pub request_data: String,
    pub request_format: String,
    pub response_data: String,
    pub response_format: String,
    pub response_delay_ms: u64,
    pub append_line_ending: bool,
    pub repeat_count: u32,
}
