import { parseHexInput } from "../../utils/hex";

export type ChecksumResult = {
  sum8: string;
  xor8: string;
  crc16Modbus: string;
};

export type ProtocolFieldDefinition = {
  name: string;
  offset: number;
  length: number;
  type: "hex" | "uint8" | "uint16le" | "uint16be" | "ascii";
};

export type ParsedProtocolField = {
  name: string;
  value: string;
  rawHex: string;
};

export function calculateChecksums(hexInput: string): ChecksumResult {
  const bytes = [...parseHexInput(hexInput)];

  return {
    sum8: toHex(sum8(bytes), 2),
    xor8: toHex(xor8(bytes), 2),
    crc16Modbus: toHex(crc16Modbus(bytes), 4),
  };
}

export function parseProtocolFrame(
  hexInput: string,
  fields: ProtocolFieldDefinition[],
): ParsedProtocolField[] {
  const bytes = [...parseHexInput(hexInput)];

  return fields.map((field) => {
    validateField(field, bytes.length);
    const fieldBytes = bytes.slice(field.offset, field.offset + field.length);
    return {
      name: field.name,
      rawHex: fieldBytes.map((byte) => toHex(byte, 2)).join(" "),
      value: renderFieldValue(fieldBytes, field.type),
    };
  });
}

function validateField(field: ProtocolFieldDefinition, byteLength: number): void {
  if (!field.name || typeof field.name !== "string") {
    throw new Error("协议字段必须包含 name");
  }

  if (!Number.isInteger(field.offset) || field.offset < 0) {
    throw new Error(`字段 ${field.name} 的 offset 必须是非负整数`);
  }

  if (!Number.isInteger(field.length) || field.length <= 0) {
    throw new Error(`字段 ${field.name} 的 length 必须是正整数`);
  }

  if (field.offset + field.length > byteLength) {
    throw new Error(`字段 ${field.name} 超出当前 HEX 帧长度`);
  }

  if ((field.type === "uint16le" || field.type === "uint16be") && field.length !== 2) {
    throw new Error(`字段 ${field.name} 使用 ${field.type} 时 length 必须为 2`);
  }
}

function renderFieldValue(bytes: number[], type: ProtocolFieldDefinition["type"]): string {
  switch (type) {
    case "hex":
      return bytes.map((byte) => toHex(byte, 2)).join(" ");
    case "uint8":
      return String(bytes[0] ?? 0);
    case "uint16le":
      return String((bytes[0] ?? 0) | ((bytes[1] ?? 0) << 8));
    case "uint16be":
      return String(((bytes[0] ?? 0) << 8) | (bytes[1] ?? 0));
    case "ascii":
      return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
  }
}

function sum8(bytes: number[]): number {
  return bytes.reduce((sum, byte) => (sum + byte) & 0xff, 0);
}

function xor8(bytes: number[]): number {
  return bytes.reduce((sum, byte) => sum ^ byte, 0);
}

function crc16Modbus(bytes: number[]): number {
  let crc = 0xffff;

  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      if ((crc & 0x0001) !== 0) {
        crc = (crc >> 1) ^ 0xa001;
      } else {
        crc >>= 1;
      }
    }
  }

  return crc & 0xffff;
}

function toHex(value: number, width: number): string {
  return value.toString(16).toUpperCase().padStart(width, "0");
}
