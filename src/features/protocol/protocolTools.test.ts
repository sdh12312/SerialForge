import { describe, expect, it } from "vitest";

import { calculateChecksums, parseProtocolFrame } from "./protocolTools";

describe("协议校验工具", () => {
  it("计算常用校验值", () => {
    expect(calculateChecksums("01 02 03")).toEqual({
      sum8: "06",
      xor8: "00",
      crc16Modbus: "6161",
    });
  });

  it("按字段定义解析协议帧", () => {
    expect(
      parseProtocolFrame("AA 55 34 12 4F 4B", [
        { name: "header", offset: 0, length: 2, type: "hex" },
        { name: "value", offset: 2, length: 2, type: "uint16le" },
        { name: "text", offset: 4, length: 2, type: "ascii" },
      ]),
    ).toEqual([
      { name: "header", rawHex: "AA 55", value: "AA 55" },
      { name: "value", rawHex: "34 12", value: "4660" },
      { name: "text", rawHex: "4F 4B", value: "OK" },
    ]);
  });

  it("阻止越界字段解析", () => {
    expect(() =>
      parseProtocolFrame("AA 55", [{ name: "payload", offset: 1, length: 2, type: "hex" }]),
    ).toThrow("字段 payload 超出当前 HEX 帧长度");
  });
});
