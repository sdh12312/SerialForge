import type { TerminalLine } from "../../stores/serialStore";

export type AutomationStepKind =
  | "send_text"
  | "send_hex"
  | "wait_ms"
  | "wait_text"
  | "wait_hex"
  | "regex_match";

export type AutomationStep = {
  kind: AutomationStepKind;
  data?: string;
  timeoutMs?: number;
};

export type AutomationScript = {
  name: string;
  steps: AutomationStep[];
};

export type AutomationStepStatus = "pending" | "running" | "passed" | "failed";

export type AutomationStepResult = {
  index: number;
  step: AutomationStep;
  status: AutomationStepStatus;
  message: string;
  timestamp: string;
};

const defaultTimeoutMs = 1000;

export function parseAutomationScript(input: string): AutomationScript {
  const parsed = JSON.parse(input) as Partial<AutomationScript>;

  if (!parsed.name || typeof parsed.name !== "string") {
    throw new Error("自动化脚本必须包含 name");
  }

  if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) {
    throw new Error("自动化脚本必须包含至少 1 个步骤");
  }

  return {
    name: parsed.name,
    steps: parsed.steps.map(normalizeStep),
  };
}

export function findMatchingLine(
  lines: TerminalLine[],
  step: AutomationStep,
  options: {
    connectionId?: string;
    since?: string;
  } = {},
): TerminalLine | null {
  const candidates = lines.filter((line) => {
    const matchesConnection = !options.connectionId || line.connectionId === options.connectionId;
    const matchesTime = !options.since || line.timestamp >= options.since;
    return matchesConnection && matchesTime && line.direction === "rx";
  });

  if (step.kind === "wait_text" || step.kind === "wait_hex") {
    const expected = step.data ?? "";
    return candidates.find((line) => line.content.includes(expected)) ?? null;
  }

  if (step.kind === "regex_match") {
    const regex = new RegExp(step.data ?? "");
    return candidates.find((line) => regex.test(line.content)) ?? null;
  }

  return null;
}

export function getStepTimeout(step: AutomationStep): number {
  return clampTimeout(step.timeoutMs ?? defaultTimeoutMs);
}

function normalizeStep(step: Partial<AutomationStep>, index: number): AutomationStep {
  if (!step.kind || !isStepKind(step.kind)) {
    throw new Error(`步骤 ${index + 1} 的 kind 不受支持`);
  }

  if (step.kind !== "wait_ms" && !step.data) {
    throw new Error(`步骤 ${index + 1} 必须包含 data`);
  }

  return {
    kind: step.kind,
    data: step.data,
    timeoutMs: step.timeoutMs === undefined ? undefined : clampTimeout(step.timeoutMs),
  };
}

function isStepKind(kind: string): kind is AutomationStepKind {
  return ["send_text", "send_hex", "wait_ms", "wait_text", "wait_hex", "regex_match"].includes(
    kind,
  );
}

function clampTimeout(timeoutMs: number): number {
  if (!Number.isFinite(timeoutMs)) {
    return defaultTimeoutMs;
  }

  return Math.min(60_000, Math.max(0, Math.round(timeoutMs)));
}
