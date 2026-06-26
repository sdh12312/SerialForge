import { History, SendHorizonal } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "../../components/ui/button";
import { replaceCommandVariables } from "../commands/variables";
import { useSerialStore, type LineEnding } from "../../stores/serialStore";

const commandTemplates = [
  { name: "读取版本", payload: "AT+VERSION?" },
  { name: "读取状态", payload: "AT+STATUS?" },
  { name: "带计数测试", payload: "PING ${counter}" },
  { name: "时间戳测试", payload: "TIME ${timestamp}" },
];

export function SenderPanel() {
  const [payload, setPayload] = useState("");
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopIntervalMs, setLoopIntervalMs] = useState(1000);
  const [autoResponseEnabled, setAutoResponseEnabled] = useState(false);
  const [autoResponseMatch, setAutoResponseMatch] = useState("PING");
  const [autoResponsePayload, setAutoResponsePayload] = useState("PONG ${counter}");
  const counterRef = useRef(0);
  const handledRxLineIdRef = useRef<string | null>(null);
  const {
    activeConnectionId,
    connections,
    terminalLines,
    sendMode,
    lineEnding,
    sendHistory,
    error,
    setSendMode,
    setLineEnding,
    send,
  } = useSerialStore();
  const activeConnection = connections.find((connection) => connection.id === activeConnectionId);
  const canSend = Boolean(
    activeConnection && activeConnection.state === "open" && payload.length > 0,
  );

  const resolvePayload = useCallback((value: string) => {
    const resolved = replaceCommandVariables(value, { counter: counterRef.current });
    counterRef.current += 1;
    return resolved;
  }, []);

  const handleSend = useCallback(async () => {
    await send(resolvePayload(payload));
  }, [payload, resolvePayload, send]);

  useEffect(() => {
    if (!loopEnabled || !canSend) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void handleSend();
    }, loopIntervalMs);

    return () => window.clearInterval(timer);
  }, [canSend, handleSend, loopEnabled, loopIntervalMs]);

  useEffect(() => {
    if (!autoResponseEnabled || !activeConnectionId || autoResponseMatch.length === 0) {
      return;
    }

    const latestLine = terminalLines.at(-1);
    if (
      !latestLine ||
      latestLine.id === handledRxLineIdRef.current ||
      latestLine.direction !== "rx" ||
      latestLine.connectionId !== activeConnectionId ||
      !latestLine.content.includes(autoResponseMatch)
    ) {
      return;
    }

    handledRxLineIdRef.current = latestLine.id;
    void send(resolvePayload(autoResponsePayload));
  }, [
    activeConnectionId,
    autoResponseEnabled,
    autoResponseMatch,
    autoResponsePayload,
    resolvePayload,
    send,
    terminalLines,
  ]);

  return (
    <div className="module-resizable rounded-xl border border-border bg-background/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="block text-sm font-medium" htmlFor="send-box">
          发送区
        </label>
        <span className="text-xs text-muted-foreground">
          目标：{activeConnection?.displayName ?? "未选择"}
        </span>
        <div className="flex items-center gap-2">
          {sendHistory.length > 0 && (
            <select
              className="h-8 max-w-36 rounded-lg border border-border bg-panel px-2 text-xs outline-none"
              defaultValue=""
              aria-label="发送历史"
              onChange={(event) => {
                setPayload(event.target.value);
                event.target.value = "";
              }}
            >
              <option value="" disabled>
                历史
              </option>
              {sendHistory.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          )}
          <select
            className="h-8 max-w-36 rounded-lg border border-border bg-panel px-2 text-xs outline-none"
            defaultValue=""
            aria-label="命令模板"
            onChange={(event) => {
              setPayload(event.target.value);
              event.target.value = "";
            }}
          >
            <option value="" disabled>
              命令
            </option>
            {commandTemplates.map((command) => (
              <option key={command.name} value={command.payload}>
                {command.name}
              </option>
            ))}
          </select>
          <select
            className="h-8 rounded-lg border border-border bg-panel px-2 text-xs outline-none"
            value={sendMode}
            onChange={(event) => setSendMode(event.target.value as "text" | "hex")}
          >
            <option value="text">文本</option>
            <option value="hex">HEX</option>
          </select>
          <select
            className="h-8 rounded-lg border border-border bg-panel px-2 text-xs outline-none disabled:opacity-50"
            value={lineEnding}
            disabled={sendMode === "hex"}
            onChange={(event) => setLineEnding(event.target.value as LineEnding)}
          >
            <option value="none">无行尾</option>
            <option value="cr">CR</option>
            <option value="lf">LF</option>
            <option value="crlf">CRLF</option>
          </select>
        </div>
      </div>
      <textarea
        id="send-box"
        className="h-24 w-full resize-none rounded-lg border border-border bg-panel p-3 font-mono text-sm outline-none transition focus:border-primary"
        placeholder={sendMode === "hex" ? "AA 55 01 00" : "输入要发送的文本"}
        value={payload}
        onChange={(event) => setPayload(event.target.value)}
      />
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {sendMode === "hex"
            ? "支持空格分隔 HEX，非法输入会提示。"
            : "文本模式支持变量：${counter}、${timestamp}、${random}。"}
        </span>
        <span className="flex items-center gap-1">
          <History className="h-3.5 w-3.5" />
          历史 {sendHistory.length}/20
        </span>
      </div>
      {error && (
        <p className="mt-2 rounded-lg border border-danger/30 bg-danger/10 p-2 text-xs text-danger">
          {error}
        </p>
      )}
      <Button className="mt-3 w-full" size="sm" onClick={handleSend} disabled={!canSend}>
        <SendHorizonal className="h-4 w-4" />
        发送到当前连接
      </Button>
      <div className="mt-3 grid grid-cols-[1fr_96px] gap-2 text-xs">
        <label className="flex items-center gap-2 rounded-lg border border-border bg-panel px-2 py-2">
          <input
            type="checkbox"
            checked={loopEnabled}
            onChange={(event) => setLoopEnabled(event.target.checked)}
          />
          循环发送
        </label>
        <input
          className="rounded-lg border border-border bg-panel px-2 outline-none"
          type="number"
          min={100}
          max={60000}
          value={loopIntervalMs}
          onChange={(event) => setLoopIntervalMs(Number(event.target.value))}
          aria-label="循环间隔毫秒"
        />
      </div>
      <div className="mt-3 space-y-2 rounded-lg border border-border bg-panel p-2 text-xs">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoResponseEnabled}
            onChange={(event) => setAutoResponseEnabled(event.target.checked)}
          />
          自动应答
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="rounded-lg border border-border bg-background px-2 py-1 outline-none"
            value={autoResponseMatch}
            onChange={(event) => setAutoResponseMatch(event.target.value)}
            placeholder="匹配内容"
          />
          <input
            className="rounded-lg border border-border bg-background px-2 py-1 outline-none"
            value={autoResponsePayload}
            onChange={(event) => setAutoResponsePayload(event.target.value)}
            placeholder="应答内容"
          />
        </div>
      </div>
    </div>
  );
}
