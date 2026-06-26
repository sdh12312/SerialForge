import { Cable } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "../../components/ui/badge";
import { useSerialStore, type SendMode } from "../../stores/serialStore";

export function BridgePanel() {
  const { connections, terminalLines, sendToConnection } = useSerialStore();
  const [enabled, setEnabled] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [mode, setMode] = useState<SendMode>("text");
  const handledLineIdRef = useRef<string | null>(null);

  const validationMessage = useMemo(() => validateBridge(sourceId, targetId), [sourceId, targetId]);

  useEffect(() => {
    if (!enabled || validationMessage) {
      return;
    }

    const latestLine = terminalLines.at(-1);
    if (
      !latestLine ||
      latestLine.id === handledLineIdRef.current ||
      latestLine.direction !== "rx" ||
      latestLine.connectionId !== sourceId
    ) {
      return;
    }

    handledLineIdRef.current = latestLine.id;
    void sendToConnection(targetId, latestLine.content, {
      mode,
      addToHistory: false,
    });
  }, [enabled, mode, sendToConnection, sourceId, targetId, terminalLines, validationMessage]);

  return (
    <section className="rounded-xl border border-border bg-background/70 p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Cable className="h-4 w-4 text-primary" />
          串口桥接
        </span>
        <Badge tone="success">阶段 8</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="space-y-1 text-muted-foreground">
          <span>源 RX</span>
          <ConnectionSelect value={sourceId} connections={connections} onChange={setSourceId} />
        </label>
        <label className="space-y-1 text-muted-foreground">
          <span>转发到</span>
          <ConnectionSelect value={targetId} connections={connections} onChange={setTargetId} />
        </label>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_96px] gap-2 text-xs">
        <label className="flex items-center gap-2 rounded-lg border border-border bg-panel px-2 py-2">
          <input
            type="checkbox"
            checked={enabled}
            disabled={Boolean(validationMessage)}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          启用单向桥接
        </label>
        <select
          className="rounded-lg border border-border bg-panel px-2 outline-none"
          value={mode}
          onChange={(event) => setMode(event.target.value as SendMode)}
        >
          <option value="text">文本</option>
          <option value="hex">HEX</option>
        </select>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        当前实现为安全的一向转发：源连接收到 RX 后，按所选模式写入目标连接。
      </p>
      {validationMessage && (
        <p className="mt-2 rounded-lg border border-warning/30 bg-warning/10 p-2 text-xs text-warning">
          {validationMessage}
        </p>
      )}
    </section>
  );
}

function ConnectionSelect({
  value,
  connections,
  onChange,
}: {
  value: string;
  connections: { id: string; displayName: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      className="h-8 w-full rounded-lg border border-border bg-panel px-2 text-xs text-foreground outline-none"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">未选择</option>
      {connections.map((connection) => (
        <option key={connection.id} value={connection.id}>
          {connection.displayName}
        </option>
      ))}
    </select>
  );
}

function validateBridge(sourceId: string, targetId: string): string | null {
  if (!sourceId || !targetId) {
    return "请选择源连接和目标连接。";
  }

  if (sourceId === targetId) {
    return "源连接和目标连接不能相同。";
  }

  if (
    (sourceId === "virtual_a" && targetId === "virtual_b") ||
    (sourceId === "virtual_b" && targetId === "virtual_a")
  ) {
    return "内置虚拟串口对已经会互相回环，不能再直接桥接，避免无限转发。";
  }

  return null;
}
