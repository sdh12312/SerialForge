use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum LogKind {
    Application,
    SerialIo,
    VirtualLink,
    AutoResponse,
    Automation,
    Error,
}
