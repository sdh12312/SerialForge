export function parseHexInput(input: string): Uint8Array {
  const normalized = input.replace(/\s+/g, "").toUpperCase();

  if (normalized.length === 0) {
    return new Uint8Array();
  }

  if (normalized.length % 2 !== 0 || /[^0-9A-F]/u.test(normalized)) {
    throw new Error("HEX 内容必须由偶数个 0-9 或 A-F 字符组成");
  }

  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }

  return bytes;
}

export function formatHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" ");
}
