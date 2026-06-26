import { invoke } from "@tauri-apps/api/core";

import { formatHex, parseHexInput } from "../utils/hex";
import { isTauriRuntime } from "./runtime";

export type SerialConfig = {
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: "none" | "odd" | "even";
  flowControl: "none" | "software" | "hardware";
  dtr: boolean;
  rts: boolean;
  autoReconnect: boolean;
};

export type SerialPortSummary = {
  portName: string;
  displayName: string;
  portType: string;
  manufacturer?: string | null;
  product?: string | null;
  serialNumber?: string | null;
  isOpen: boolean;
};

export type ConnectionSnapshot = {
  id: string;
  portName: string;
  displayName: string;
  state: "closed" | "opening" | "open" | "error" | "disconnected";
  rxBytes: number;
  txBytes: number;
};

export type SerialDataEvent = {
  connectionId: string;
  portName: string;
  data: number[];
  hex: string;
  receivedAt: string;
};

export type SerialStatusEvent = {
  connectionId: string;
  state: ConnectionSnapshot["state"];
  message: string;
};

export type SerialWriteResult = {
  connectionId: string;
  bytesWritten: number;
};

type TauriErrorPayload = {
  kind?: string;
  message?: string;
};

export const defaultSerialConfig: SerialConfig = {
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  flowControl: "none",
  dtr: false,
  rts: false,
  autoReconnect: false,
};

export async function listSerialPorts(): Promise<SerialPortSummary[]> {
  if (!isTauriRuntime()) {
    return [];
  }

  return invoke<SerialPortSummary[]>("list_serial_ports");
}

export async function openSerialConnection(
  portName: string,
  config: SerialConfig = defaultSerialConfig,
): Promise<ConnectionSnapshot> {
  if (!isTauriRuntime()) {
    throw new Error("浏览器预览模式不能打开物理串口，请使用 Tauri 桌面壳运行。");
  }

  return invoke<ConnectionSnapshot>("open_serial_connection", {
    portName,
    config,
    displayName: portName,
  });
}

export async function closeSerialConnection(connectionId: string): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("close_serial_connection", { connectionId });
}

export async function sendSerialText(
  connectionId: string,
  text: string,
): Promise<SerialWriteResult> {
  return sendSerialBytes(connectionId, [...new TextEncoder().encode(text)]);
}

export async function sendSerialHex(connectionId: string, hex: string): Promise<SerialWriteResult> {
  return sendSerialBytes(connectionId, [...parseHexInput(hex)]);
}

async function sendSerialBytes(connectionId: string, data: number[]): Promise<SerialWriteResult> {
  if (!isTauriRuntime()) {
    return {
      connectionId,
      bytesWritten: data.length,
    };
  }

  return invoke<SerialWriteResult>("write_serial_data", { connectionId, data });
}

export function renderSerialData(event: SerialDataEvent, mode: "text" | "hex" | "mixed"): string {
  if (mode === "hex") {
    return event.hex || formatHex(new Uint8Array(event.data));
  }

  const bytes = new Uint8Array(event.data);
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);

  if (mode === "mixed") {
    return text + "    [" + (event.hex || formatHex(bytes)) + "]";
  }

  return text;
}

export function getSerialErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (isTauriErrorPayload(error) && error.message) {
    return error.message;
  }

  return "串口操作失败";
}

function isTauriErrorPayload(error: unknown): error is TauriErrorPayload {
  return typeof error === "object" && error !== null && "message" in error;
}
