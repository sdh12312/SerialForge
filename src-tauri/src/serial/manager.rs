use std::{
    collections::HashMap,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use serde::{Deserialize, Serialize};
use serialport::SerialPortType;
use tauri::AppHandle;

use crate::error::SerialForgeError;

use super::{
    config::SerialConfig,
    connection::{ConnectionSnapshot, SerialConnection},
};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SerialPortSummary {
    pub port_name: String,
    pub display_name: String,
    pub port_type: String,
    pub manufacturer: Option<String>,
    pub product: Option<String>,
    pub serial_number: Option<String>,
    pub is_open: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenSerialRequest {
    pub port_name: String,
    pub config: SerialConfig,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SerialWriteRequest {
    pub connection_id: String,
    pub bytes_written: usize,
}

#[derive(Default)]
pub struct SerialManager {
    connections: HashMap<String, SerialConnection>,
    port_to_connection: HashMap<String, String>,
}

impl SerialManager {
    pub fn list_ports() -> Result<Vec<SerialPortSummary>, SerialForgeError> {
        let ports = serialport::available_ports()
            .map_err(|error| SerialForgeError::ReadFailed(error.to_string()))?;

        Ok(ports
            .into_iter()
            .map(|port| {
                let (port_type, manufacturer, product, serial_number) = match port.port_type {
                    SerialPortType::UsbPort(info) => (
                        "usb".to_string(),
                        info.manufacturer,
                        info.product,
                        info.serial_number,
                    ),
                    SerialPortType::BluetoothPort => ("bluetooth".to_string(), None, None, None),
                    SerialPortType::PciPort => ("pci".to_string(), None, None, None),
                    SerialPortType::Unknown => ("unknown".to_string(), None, None, None),
                };

                SerialPortSummary {
                    display_name: port.port_name.clone(),
                    port_name: port.port_name,
                    port_type,
                    manufacturer,
                    product,
                    serial_number,
                    is_open: false,
                }
            })
            .collect())
    }

    pub fn open(
        &mut self,
        app: AppHandle,
        request: OpenSerialRequest,
    ) -> Result<ConnectionSnapshot, SerialForgeError> {
        if self.port_to_connection.contains_key(&request.port_name) {
            return Err(SerialForgeError::PortBusy(format!(
                "{} 已在 SerialForge 中打开",
                request.port_name
            )));
        }

        let connection_id = create_connection_id(&request.port_name);
        let data_bits = request
            .config
            .to_data_bits()
            .map_err(SerialForgeError::UnsupportedParameter)?;
        let stop_bits = request
            .config
            .to_stop_bits()
            .map_err(SerialForgeError::UnsupportedParameter)?;

        let port = serialport::new(&request.port_name, request.config.baud_rate)
            .data_bits(data_bits)
            .stop_bits(stop_bits)
            .parity(request.config.to_parity())
            .flow_control(request.config.to_flow_control())
            .timeout(Duration::from_millis(50))
            .open()
            .map_err(|error| map_open_error(&request.port_name, error.to_string()))?;

        let display_name = request
            .display_name
            .clone()
            .unwrap_or_else(|| request.port_name.clone());
        let connection = SerialConnection::new(
            app,
            connection_id.clone(),
            request.port_name.clone(),
            display_name,
            request.config,
            port,
        )
        .map_err(SerialForgeError::UnsupportedParameter)?;
        let snapshot = connection.snapshot();

        self.port_to_connection
            .insert(request.port_name, connection_id.clone());
        self.connections.insert(connection_id, connection);

        Ok(snapshot)
    }

    pub fn close(&mut self, connection_id: &str) -> Result<(), SerialForgeError> {
        let connection = self
            .connections
            .remove(connection_id)
            .ok_or_else(|| SerialForgeError::PortNotFound(connection_id.to_string()))?;
        self.port_to_connection
            .remove(&connection.snapshot().port_name);
        drop(connection);
        Ok(())
    }

    pub fn write(
        &mut self,
        connection_id: &str,
        data: &[u8],
    ) -> Result<SerialWriteRequest, SerialForgeError> {
        let connection = self
            .connections
            .get_mut(connection_id)
            .ok_or_else(|| SerialForgeError::PortNotFound(connection_id.to_string()))?;
        let bytes_written = connection
            .write(data)
            .map_err(SerialForgeError::WriteFailed)?;

        Ok(SerialWriteRequest {
            connection_id: connection_id.to_string(),
            bytes_written,
        })
    }
}

fn create_connection_id(port_name: &str) -> String {
    let safe_port_name = port_name
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() {
                character
            } else {
                '_'
            }
        })
        .collect::<String>();
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default();

    format!("serial_{safe_port_name}_{millis}")
}

fn map_open_error(port_name: &str, message: String) -> SerialForgeError {
    let lower_message = message.to_lowercase();
    if lower_message.contains("access") || lower_message.contains("denied") {
        SerialForgeError::PortBusy(port_name.to_string())
    } else if lower_message.contains("not found") || lower_message.contains("不存在") {
        SerialForgeError::PortNotFound(port_name.to_string())
    } else {
        SerialForgeError::ReadFailed(message)
    }
}

#[cfg(test)]
mod tests {
    use super::create_connection_id;

    #[test]
    fn connection_id_uses_safe_port_name() {
        let id = create_connection_id("COM 1");
        assert!(id.starts_with("serial_COM_1_"));
    }
}
