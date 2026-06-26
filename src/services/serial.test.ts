import { describe, expect, it } from "vitest";

import { getSerialErrorMessage, renderSerialData, type SerialDataEvent } from "./serial";

const event: SerialDataEvent = {
  connectionId: "conn-1",
  portName: "COM1",
  data: [0x4f, 0x4b],
  hex: "4F 4B",
  receivedAt: "2026-06-22T00:00:00.000Z",
};

describe("串口数据渲染", () => {
  it("按文本显示接收数据", () => {
    expect(renderSerialData(event, "text")).toBe("OK");
  });

  it("按 HEX 显示接收数据", () => {
    expect(renderSerialData(event, "hex")).toBe("4F 4B");
  });

  it("按混合模式显示接收数据", () => {
    expect(renderSerialData(event, "mixed")).toBe("OK    [4F 4B]");
  });
});

describe("串口错误消息", () => {
  it("透传 Tauri 后端错误 payload", () => {
    expect(getSerialErrorMessage({ kind: "port_busy", message: "端口已被占用: COM1" })).toBe(
      "端口已被占用: COM1",
    );
  });
});
