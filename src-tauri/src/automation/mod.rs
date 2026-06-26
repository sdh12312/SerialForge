use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TestStepKind {
    SendText,
    SendHex,
    WaitMs,
    WaitText,
    WaitHex,
    RegexMatch,
}
