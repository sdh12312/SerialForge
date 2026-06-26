import { describe, expect, it } from "vitest";

import { formatHex, parseHexInput } from "./hex";

describe("HEX 输入工具", () => {
  it("解析带空格的 HEX 字符串", () => {
    expect([...parseHexInput("AA 55 01 00")]).toEqual([0xaa, 0x55, 0x01, 0x00]);
  });

  it("拒绝非法 HEX 字符串", () => {
    expect(() => parseHexInput("AA 5")).toThrow("HEX 内容");
    expect(() => parseHexInput("AA ZZ")).toThrow("HEX 内容");
  });

  it("格式化字节为大写 HEX", () => {
    expect(formatHex(new Uint8Array([0, 15, 170, 255]))).toBe("00 0F AA FF");
  });
});
