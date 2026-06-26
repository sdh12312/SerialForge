use tauri::{AppHandle, State};

use crate::{
    error::{ErrorPayload, SerialForgeError},
    serial::{
        config::SerialConfig,
        manager::{OpenSerialRequest, SerialManager, SerialPortSummary, SerialWriteRequest},
    },
    AppState,
};

type CommandResult<T> = Result<T, ErrorPayload>;

#[tauri::command]
pub fn list_serial_ports() -> CommandResult<Vec<SerialPortSummary>> {
    SerialManager::list_ports().map_err(ErrorPayload::from)
}

#[tauri::command]
pub fn open_serial_connection(
    app: AppHandle,
    state: State<'_, AppState>,
    port_name: String,
    config: SerialConfig,
    display_name: Option<String>,
) -> CommandResult<crate::serial::connection::ConnectionSnapshot> {
    let request = OpenSerialRequest {
        port_name,
        config,
        display_name,
    };

    let mut manager = state.serial_manager.lock().map_err(|_| {
        ErrorPayload::from(SerialForgeError::InvalidConfig(
            "串口管理器锁已损坏，无法打开连接".to_string(),
        ))
    })?;

    manager.open(app, request).map_err(ErrorPayload::from)
}

#[tauri::command]
pub fn close_serial_connection(
    state: State<'_, AppState>,
    connection_id: String,
) -> CommandResult<()> {
    let mut manager = state.serial_manager.lock().map_err(|_| {
        ErrorPayload::from(SerialForgeError::InvalidConfig(
            "串口管理器锁已损坏，无法关闭连接".to_string(),
        ))
    })?;

    manager.close(&connection_id).map_err(ErrorPayload::from)
}

#[tauri::command]
pub fn write_serial_data(
    state: State<'_, AppState>,
    connection_id: String,
    data: Vec<u8>,
) -> CommandResult<SerialWriteRequest> {
    let mut manager = state.serial_manager.lock().map_err(|_| {
        ErrorPayload::from(SerialForgeError::InvalidConfig(
            "串口管理器锁已损坏，无法写入串口".to_string(),
        ))
    })?;

    manager
        .write(&connection_id, &data)
        .map_err(ErrorPayload::from)
}
