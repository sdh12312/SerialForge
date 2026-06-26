import { Play, Square } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useSerialStore } from "../../stores/serialStore";
import {
  findMatchingLine,
  getStepTimeout,
  parseAutomationScript,
  type AutomationScript,
  type AutomationStep,
  type AutomationStepResult,
} from "./automationScript";

const exampleScript = JSON.stringify(
  {
    name: "虚拟回环冒烟测试",
    steps: [
      { kind: "send_hex", data: "AA 55 01 00" },
      { kind: "wait_hex", data: "AA 55 01 00", timeoutMs: 1000 },
    ],
  },
  null,
  2,
);

export function AutomationPanel() {
  const { connections, activeConnectionId, sendToConnection } = useSerialStore();
  const [scriptText, setScriptText] = useState(exampleScript);
  const [targetConnectionId, setTargetConnectionId] = useState("active");
  const [observeConnectionId, setObserveConnectionId] = useState("auto");
  const [results, setResults] = useState<AutomationStepResult[]>([]);
  const [running, setRunning] = useState(false);
  const stoppedRef = useRef(false);

  const script = useMemo(() => {
    try {
      return { value: parseAutomationScript(scriptText), error: null };
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : "自动化脚本解析失败",
      };
    }
  }, [scriptText]);

  const resolvedTargetId = resolveConnectionSelection(targetConnectionId, activeConnectionId);
  const resolvedObserveId =
    observeConnectionId === "auto"
      ? getDefaultObserveConnectionId(resolvedTargetId)
      : resolveConnectionSelection(observeConnectionId, activeConnectionId);
  const canRun = Boolean(!running && script.value && resolvedTargetId);

  async function handleRun() {
    if (!script.value || !resolvedTargetId) {
      return;
    }

    stoppedRef.current = false;
    setRunning(true);
    setResults([]);

    try {
      await runAutomationScript(
        script.value,
        resolvedTargetId,
        resolvedObserveId || resolvedTargetId,
      );
    } finally {
      setRunning(false);
    }
  }

  async function runAutomationScript(
    automationScript: AutomationScript,
    targetId: string,
    observeId: string,
  ) {
    const startedAt = new Date().toISOString();

    for (const [index, step] of automationScript.steps.entries()) {
      if (stoppedRef.current) {
        appendResult(index, step, "failed", "已手动停止");
        return;
      }

      appendResult(index, step, "running", "执行中");
      const passed = await runStep(index, step, targetId, observeId, startedAt);
      if (!passed) {
        return;
      }
    }
  }

  async function runStep(
    index: number,
    step: AutomationStep,
    targetId: string,
    observeId: string,
    startedAt: string,
  ): Promise<boolean> {
    if (step.kind === "send_text" || step.kind === "send_hex") {
      const ok = await sendToConnection(targetId, step.data ?? "", {
        mode: step.kind === "send_hex" ? "hex" : "text",
        addToHistory: false,
      });
      appendResult(index, step, ok ? "passed" : "failed", ok ? "发送完成" : "发送失败");
      return ok;
    }

    if (step.kind === "wait_ms") {
      await delay(getStepTimeout(step));
      appendResult(index, step, "passed", "等待完成");
      return true;
    }

    const matched = await waitForMatch(step, observeId, startedAt);
    appendResult(
      index,
      step,
      matched ? "passed" : "failed",
      matched ? "匹配到：" + matched.content : "等待超时，未匹配到目标内容",
    );
    return Boolean(matched);
  }

  function appendResult(
    index: number,
    step: AutomationStep,
    status: AutomationStepResult["status"],
    message: string,
  ) {
    setResults((current) => [
      ...current.filter((result) => result.index !== index),
      {
        index,
        step,
        status,
        message,
        timestamp: new Date().toISOString(),
      },
    ]);
  }

  async function waitForMatch(step: AutomationStep, observeId: string, startedAt: string) {
    const timeoutMs = getStepTimeout(step);
    const deadline = Date.now() + timeoutMs;

    while (Date.now() <= deadline && !stoppedRef.current) {
      const matched = findMatchingLine(useSerialStore.getState().terminalLines, step, {
        connectionId: observeId,
        since: startedAt,
      });
      if (matched) {
        return matched;
      }

      await delay(80);
    }

    return null;
  }

  return (
    <section className="rounded-xl border border-border bg-background/70 p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">自动化测试</span>
        <Badge tone="success">阶段 8</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="space-y-1 text-muted-foreground">
          <span>发送连接</span>
          <ConnectionSelect
            value={targetConnectionId}
            activeConnectionId={activeConnectionId}
            connections={connections}
            onChange={setTargetConnectionId}
          />
        </label>
        <label className="space-y-1 text-muted-foreground">
          <span>观察连接</span>
          <ConnectionSelect
            value={observeConnectionId}
            activeConnectionId={activeConnectionId}
            connections={connections}
            autoLabel="自动"
            onChange={setObserveConnectionId}
          />
        </label>
      </div>
      <textarea
        className="mt-2 h-40 w-full resize-y rounded-lg border border-border bg-panel p-2 font-mono text-xs text-foreground outline-none"
        value={scriptText}
        onChange={(event) => setScriptText(event.target.value)}
      />
      {script.error && (
        <p className="mt-2 rounded-lg border border-danger/30 bg-danger/10 p-2 text-xs text-danger">
          {script.error}
        </p>
      )}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button size="sm" disabled={!canRun} onClick={handleRun}>
          <Play className="h-4 w-4" />
          运行
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!running}
          onClick={() => {
            stoppedRef.current = true;
          }}
        >
          <Square className="h-4 w-4" />
          停止
        </Button>
      </div>
      <div className="mt-3 space-y-1 text-xs">
        {results.length === 0 ? (
          <p className="text-muted-foreground">运行后会显示每一步的通过/失败状态。</p>
        ) : (
          [...results]
            .sort((left, right) => left.index - right.index)
            .map((result) => (
              <div
                key={result.index}
                className="rounded-lg border border-border bg-panel px-2 py-1"
              >
                <span className={result.status === "failed" ? "text-danger" : "text-success"}>
                  {result.status}
                </span>
                <span className="ml-2 font-mono">{result.step.kind}</span>
                <span className="ml-2 text-muted-foreground">{result.message}</span>
              </div>
            ))
        )}
      </div>
    </section>
  );
}

function ConnectionSelect({
  value,
  activeConnectionId,
  connections,
  autoLabel,
  onChange,
}: {
  value: string;
  activeConnectionId: string | null;
  connections: { id: string; displayName: string }[];
  autoLabel?: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      className="h-8 w-full rounded-lg border border-border bg-panel px-2 text-xs text-foreground outline-none"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {autoLabel && <option value="auto">{autoLabel}</option>}
      <option value="active">当前连接{activeConnectionId ? "" : "（未选择）"}</option>
      {connections.map((connection) => (
        <option key={connection.id} value={connection.id}>
          {connection.displayName}
        </option>
      ))}
    </select>
  );
}

function resolveConnectionSelection(
  value: string,
  activeConnectionId: string | null,
): string | null {
  if (value === "active") {
    return activeConnectionId;
  }

  return value || null;
}

function getDefaultObserveConnectionId(targetConnectionId: string | null): string | null {
  if (targetConnectionId === "virtual_a") {
    return "virtual_b";
  }

  if (targetConnectionId === "virtual_b") {
    return "virtual_a";
  }

  return targetConnectionId;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
