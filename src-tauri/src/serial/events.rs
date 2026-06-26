use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SerialDataEvent {
    pub connection_id: String,
    pub port_name: String,
    pub data: Vec<u8>,
    pub hex: String,
    pub received_at: String,
}

impl SerialDataEvent {
    pub fn new(connection_id: String, port_name: String, data: Vec<u8>) -> Self {
        let hex = data
            .iter()
            .map(|byte| format!("{byte:02X}"))
            .collect::<Vec<_>>()
            .join(" ");

        Self {
            connection_id,
            port_name,
            data,
            hex,
            received_at: Utc::now().to_rfc3339(),
        }
    }
}
