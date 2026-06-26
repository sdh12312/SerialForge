import { describe, expect, it } from "vitest";

import { replaceCommandVariables } from "./variables";

describe("命令变量替换", () => {
  it("替换阶段 1 要求的 timestamp、counter 和 random", () => {
    const result = replaceCommandVariables("T=${timestamp};C=${counter};R=${random}", {
      now: new Date("2026-06-22T00:00:00.000Z"),
      counter: 7,
      random: () => 0.25,
    });

    expect(result).toBe("T=1782086400000;C=7;R=0.250000");
  });
});
