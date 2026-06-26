pub mod automation;
pub mod commands;
pub mod error;
pub mod logging;
pub mod protocol;
pub mod serial;
pub mod storage;
pub mod virtual_port;

use std::sync::Mutex;

#[derive(Default)]
pub struct AppState {
    pub serial_manager: Mutex<serial::manager::SerialManager>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let result = tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::health::backend_status,
            commands::serial::list_serial_ports,
            commands::serial::open_serial_connection,
            commands::serial::close_serial_connection,
            commands::serial::write_serial_data
        ])
        .run(tauri::generate_context!());

    if let Err(error) = result {
        eprintln!("SerialForge 启动失败: {error}");
    }
}
