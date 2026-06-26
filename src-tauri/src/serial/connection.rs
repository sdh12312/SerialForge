use std::{
    io::{ErrorKind, Read, Write},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    thread::{self, JoinHandle},
    time::Duration,
};

use serde::{Deserialize, Serialize};
use serialport::SerialPort;
use tauri::{AppHandle, Emitter};

use super::{config::SerialConfig, events::SerialDataEvent};

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ConnectionState {
    Closed,
    Opening,
    Open,
    Error,
    Disconnected,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionSnapshot {
    pub id: String,
    pub port_name: String,
    pub display_name: String,
    pub state: ConnectionState,
    pub rx_bytes: u64,
    pub tx_bytes: u64,
}

pub struct SerialConnection {
    id: String,
    port_name: String,
    display_name: String,
    writer: Arc<Mutex<Box<dyn SerialPort>>>,
    running: Arc<AtomicBool>,
    reader_thread: Option<JoinHandle<()>>,
    rx_bytes: u64,
    tx_bytes: u64,
}

impl SerialConnection {
    pub fn new(
        app: AppHandle,
        id: String,
        port_name: String,
        display_name: String,
        config: SerialConfig,
        mut port: Box<dyn SerialPort>,
    ) -> Result<Self, String> {
        port.write_data_terminal_ready(config.dtr)
            .map_err(|error| format!("设置 DTR 失败: {error}"))?;
        port.write_request_to_send(config.rts)
            .map_err(|error| format!("设置 RTS 失败: {error}"))?;

        let mut reader = port
            .try_clone()
            .map_err(|error| format!("创建串口读取句柄失败: {error}"))?;
        let writer = Arc::new(Mutex::new(port));
        let running = Arc::new(AtomicBool::new(true));
        let thread_running = Arc::clone(&running);
        let thread_connection_id = id.clone();
        let thread_port_name = port_name.clone();

        let reader_thread = thread::spawn(move || {
            let mut buffer = [0_u8; 4096];

            while thread_running.load(Ordering::SeqCst) {
                match reader.read(&mut buffer) {
                    Ok(0) => thread::sleep(Duration::from_millis(5)),
                    Ok(size) => {
                        let data = buffer[..size].to_vec();
                        let event = SerialDataEvent::new(
                            thread_connection_id.clone(),
                            thread_port_name.clone(),
                            data,
                        );
                        let _ = app.emit("serial-data", event);
                    }
                    Err(error) if error.kind() == ErrorKind::TimedOut => {}
                    Err(error) => {
                        let _ = app.emit(
                            "serial-status",
                            SerialStatusEvent {
                                connection_id: thread_connection_id.clone(),
                                state: ConnectionState::Disconnected,
                                message: format!("串口读取失败或设备断开: {error}"),
                            },
                        );
                        break;
                    }
                }
            }
        });

        Ok(Self {
            id,
            port_name,
            display_name,
            writer,
            running,
            reader_thread: Some(reader_thread),
            rx_bytes: 0,
            tx_bytes: 0,
        })
    }

    pub fn snapshot(&self) -> ConnectionSnapshot {
        ConnectionSnapshot {
            id: self.id.clone(),
            port_name: self.port_name.clone(),
            display_name: self.display_name.clone(),
            state: ConnectionState::Open,
            rx_bytes: self.rx_bytes,
            tx_bytes: self.tx_bytes,
        }
    }

    pub fn write(&mut self, data: &[u8]) -> Result<usize, String> {
        let mut writer = self
            .writer
            .lock()
            .map_err(|_| "串口写入锁已损坏".to_string())?;
        writer
            .write_all(data)
            .map_err(|error| format!("串口写入失败: {error}"))?;
        self.tx_bytes = self.tx_bytes.saturating_add(data.len() as u64);
        Ok(data.len())
    }
}

impl Drop for SerialConnection {
    fn drop(&mut self) {
        self.running.store(false, Ordering::SeqCst);
        if let Some(reader_thread) = self.reader_thread.take() {
            let _ = reader_thread.join();
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SerialStatusEvent {
    pub connection_id: String,
    pub state: ConnectionState,
    pub message: String,
}
