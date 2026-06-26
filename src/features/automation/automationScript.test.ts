import { describe, expect, it } from "vitest";

import type { TerminalLine } from "../../stores/serialStore";
import { findMatchingLine, getStepTimeout, parseAutomationScript } from "./automationScript";

const lines: TerminalLine[] = [
  {
    id: "1",
    connectionId: "virtual_b",
    direction: "rx",
    content: "AA 55 01 00",
    timestamp: "2026-06-26T00:00:01.000Z",
  },
  {
    id: "2",
    connectionId: "virtual_b",
    direction: "rx",
    content: "PONG 42",
    timestamp: "2026-06-26T00:00:02.000Z",
  },
];

describe("自动化脚本", () => {
  it("解析脚本并校验步骤", () => {
    expect(
      parseAutomationScript(
        '{"name":"smoke","steps":[{"kind":"send_text","data":"PING"},{"kind":"regex_match","data":"PONG \\\\d+"}]}',
      ),
    ).toEqual({
      name: "smoke",
      steps: [
        { kind: "send_text", data: "PING", timeoutMs: undefined },
        { kind: "regex_match", data: "PONG \\d+", timeoutMs: undefined },
      ],
    });
  });

  it("查找文本或正则匹配的 RX 行", () => {
    expect(
      findMatchingLine(lines, { kind: "wait_hex", data: "AA 55" }, { connectionId: "virtual_b" })
        ?.id,
    ).toBe("1");
    expect(
      findMatchingLine(
        lines,
        { kind: "regex_match", data: "PONG \\d+" },
        { since: lines[0].timestamp },
      )?.id,
    ).toBe("2");
  });

  it("限制等待超时时间范围", () => {
    expect(getStepTimeout({ kind: "wait_ms", timeoutMs: 99_999 })).toBe(60_000);
  });
});
