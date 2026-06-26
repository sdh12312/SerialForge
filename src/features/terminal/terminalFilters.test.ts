import { describe, expect, it } from "vitest";

import type { TerminalLine } from "../../stores/serialStore";
import {
  exportTerminalLines,
  filterTerminalLines,
  summarizeTerminalLines,
} from "./terminalFilters";

const lines: TerminalLine[] = [
  {
    id: "1",
    connectionId: "a",
    direction: "rx",
    content: "TEMP=25.3",
    timestamp: "2026-06-22T00:00:00.000Z",
    byteLength: 9,
  },
  {
    id: "2",
    connectionId: "a",
    direction: "tx",
    content: "READ TEMP",
    timestamp: "2026-06-22T00:00:01.000Z",
    byteLength: 8,
  },
];

describe("终端过滤和导出", () => {
  it("按方向和关键词过滤", () => {
    expect(filterTerminalLines(lines, "temp", "rx")).toEqual([lines[0]]);
    expect(filterTerminalLines(lines, "read", "rx")).toEqual([]);
    expect(filterTerminalLines(lines, "read", "all")).toEqual([lines[1]]);
    expect(filterTerminalLines(lines, "tx", "all")).toEqual([lines[1]]);
  });

  it("导出带时间戳的日志文本", () => {
    expect(exportTerminalLines([lines[0]])).toBe("[2026-06-22T00:00:00.000Z] RX (9 B) TEMP=25.3");
  });

  it("导出 CSV 日志", () => {
    expect(exportTerminalLines([lines[0]], "csv")).toBe(
      "timestamp,direction,connectionId,byteLength,content\n2026-06-22T00:00:00.000Z,RX,a,9,TEMP=25.3",
    );
  });

  it("统计终端行和字节数", () => {
    expect(summarizeTerminalLines(lines, 3)).toMatchObject({
      total: 2,
      rx: 1,
      tx: 1,
      system: 0,
      hidden: 3,
      rxBytes: 9,
      txBytes: 8,
      connectionCount: 1,
      durationMs: 1000,
    });
  });
});
