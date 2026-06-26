import { describe, expect, it } from "vitest";

import type { TerminalLine } from "../../stores/serialStore";
import { exportCurveSamples, extractCurveSamples, summarizeCurveSamples } from "./curveSamples";

const baseLines: TerminalLine[] = [
  {
    id: "1",
    connectionId: "com1",
    direction: "system",
    content: "opened",
    timestamp: "2026-06-26T00:00:00.000Z",
  },
  {
    id: "2",
    connectionId: "com1",
    direction: "rx",
    content: "temp=24.5",
    timestamp: "2026-06-26T00:00:01.000Z",
  },
  {
    id: "3",
    connectionId: "com1",
    direction: "rx",
    content: "humidity=-12",
    timestamp: "2026-06-26T00:00:02.000Z",
  },
  {
    id: "4",
    connectionId: "com2",
    direction: "tx",
    content: "100",
    timestamp: "2026-06-26T00:00:03.000Z",
  },
];

describe("实时曲线采样", () => {
  it("从终端内容提取 RX 数值样本", () => {
    expect(extractCurveSamples(baseLines)).toMatchObject([
      { id: "2", value: 24.5, direction: "rx" },
      { id: "3", value: -12, direction: "rx" },
    ]);
  });

  it("支持方向、连接和数量过滤", () => {
    expect(
      extractCurveSamples(baseLines, {
        direction: "all",
        connectionId: "com1",
        limit: 1,
      }),
    ).toMatchObject([{ id: "3", value: -12 }]);
  });

  it("汇总最小值、最大值、平均值和最新值", () => {
    expect(summarizeCurveSamples(extractCurveSamples(baseLines))).toEqual({
      min: -12,
      max: 24.5,
      average: 6.25,
      latest: -12,
    });
  });

  it("导出曲线 CSV", () => {
    expect(exportCurveSamples(extractCurveSamples(baseLines))).toContain(
      "2026-06-26T00:00:01.000Z,com1,RX,24.5,temp=24.5",
    );
  });
});
