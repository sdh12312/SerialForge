use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct VirtualEndpoint {
    pub id: String,
    pub name: String,
    pub rx_bytes: u64,
    pub tx_bytes: u64,
}
