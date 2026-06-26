use chrono::Utc;
use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackendStatus {
    app_name: &'static str,
    backend: &'static str,
    version: &'static str,
    message: &'static str,
    checked_at: String,
}

#[tauri::command]
pub fn backend_status() -> BackendStatus {
    BackendStatus {
        app_name: "SerialForge",
        backend: "rust",
        version: env!("CARGO_PKG_VERSION"),
        message: "Rust 后端通信正常，阶段 1 命令已就绪。",
        checked_at: Utc::now().to_rfc3339(),
    }
}

#[cfg(test)]
mod tests {
    use super::backend_status;

    #[test]
    fn returns_serialforge_backend_status() {
        let status = backend_status();
        assert_eq!(status.app_name, "SerialForge");
        assert_eq!(status.backend, "rust");
    }
}
