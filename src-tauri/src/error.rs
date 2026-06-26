use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum SerialForgeError {
    #[error("端口不存在: {0}")]
    PortNotFound(String),
    #[error("端口已被占用: {0}")]
    PortBusy(String),
    #[error("参数不受支持: {0}")]
    UnsupportedParameter(String),
    #[error("读取失败: {0}")]
    ReadFailed(String),
    #[error("写入失败: {0}")]
    WriteFailed(String),
    #[error("设备已断开")]
    DeviceDisconnected,
    #[error("文件访问失败: {0}")]
    FileAccess(String),
    #[error("配置格式错误: {0}")]
    InvalidConfig(String),
}

#[derive(Debug, Serialize)]
pub struct ErrorPayload {
    pub kind: &'static str,
    pub message: String,
}

impl From<SerialForgeError> for ErrorPayload {
    fn from(error: SerialForgeError) -> Self {
        let kind = match &error {
            SerialForgeError::PortNotFound(_) => "port_not_found",
            SerialForgeError::PortBusy(_) => "port_busy",
            SerialForgeError::UnsupportedParameter(_) => "unsupported_parameter",
            SerialForgeError::ReadFailed(_) => "read_failed",
            SerialForgeError::WriteFailed(_) => "write_failed",
            SerialForgeError::DeviceDisconnected => "device_disconnected",
            SerialForgeError::FileAccess(_) => "file_access",
            SerialForgeError::InvalidConfig(_) => "invalid_config",
        };

        Self {
            kind,
            message: error.to_string(),
        }
    }
}
