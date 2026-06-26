import { Download, Pause, Play, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../../components/ui/button";
import { useSerialStore, type DirectionFilter } from "../../stores/serialStore";
import {
  exportTerminalLines,
  filterTerminalLines,
  summarizeTerminalLines,
  type TerminalExportFormat,
} from "./terminalFilters";

const directionClass = {
  rx: "text-success",
  tx: "text-primary",
  system: "text-warning",
};

export function TerminalView() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [exportFormat, setExportFormat] = useState<TerminalExportFormat>("log");
  const {
    terminalLines,
    displayMode,
    directionFilter,
    searchQuery,
    terminalPaused,
    autoScroll,
    showTimestamps,
    hiddenLineCount,
    setDisplayMode,
    setDirectionFilter,
    setSearchQuery,
    setTerminalPaused,
    setAutoScroll,
    setShowTimestamps,
    clearTerminal,
  } = useSerialStore();

  const filteredLines = useMemo(
    () => filterTerminalLines(terminalLines, searchQuery, directionFilter),
    [directionFilter, searchQuery, terminalLines],
  );
  const filteredStats = useMemo(() => summarizeTerminalLines(filteredLines), [filteredLines]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [autoScroll, filteredLines.length]);

  function handleExport() {
    const content = exportTerminalLines(filteredLines, exportFormat);
    const blob = new Blob([content], {
      type: exportFormat === "csv" ? "text/csv;charset=utf-8" : "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const extension = exportFormat === "csv" ? "csv" : "log";
    link.href = url;
    link.download =
      "serialforge-terminal-" + new Date().toISOString().replaceAll(":", "-") + "." + extension;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="module-resizable flex min-h-0 flex-col rounded-xl border border-border bg-background/70">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2">
        <div>
          <span className="text-sm font-medium">接收区</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {filteredLines.length}/{terminalLines.length} 行 · RX {filteredStats.rx} · TX{" "}
            {filteredStats.tx} · 系统 {filteredStats.system} · 最多保留最近 1000 行
          </span>
          {hiddenLineCount > 0 && (
            <span className="ml-2 text-xs text-warning">暂停期间隐藏 {hiddenLineCount} 行</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-8 items-center gap-2 rounded-lg border border-border bg-panel px-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              className="w-36 bg-transparent text-xs outline-none"
              placeholder="搜索内容/方向/连接"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <select
            className="h-8 rounded-lg border border-border bg-panel px-2 text-xs outline-none"
            value={directionFilter}
            onChange={(event) => setDirectionFilter(event.target.value as DirectionFilter)}
          >
            <option value="all">全部</option>
            <option value="rx">RX</option>
            <option value="tx">TX</option>
            <option value="system">系统</option>
          </select>
          <select
            className="h-8 rounded-lg border border-border bg-panel px-2 text-xs outline-none"
            value={displayMode}
            onChange={(event) => setDisplayMode(event.target.value as "text" | "hex" | "mixed")}
          >
            <option value="text">文本</option>
            <option value="hex">HEX</option>
            <option value="mixed">混合</option>
          </select>
          <Button
            size="sm"
            variant={terminalPaused ? "secondary" : "ghost"}
            onClick={() => setTerminalPaused(!terminalPaused)}
          >
            {terminalPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {terminalPaused ? "继续显示" : "暂停显示"}
          </Button>
          <Button
            size="sm"
            variant={autoScroll ? "secondary" : "ghost"}
            onClick={() => setAutoScroll(!autoScroll)}
          >
            自动滚动
          </Button>
          <Button
            size="sm"
            variant={showTimestamps ? "secondary" : "ghost"}
            onClick={() => setShowTimestamps(!showTimestamps)}
          >
            时间戳
          </Button>
          <select
            className="h-8 rounded-lg border border-border bg-panel px-2 text-xs outline-none"
            value={exportFormat}
            onChange={(event) => setExportFormat(event.target.value as TerminalExportFormat)}
          >
            <option value="log">LOG</option>
            <option value="csv">CSV</option>
          </select>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleExport}
            disabled={filteredLines.length === 0}
          >
            <Download className="h-4 w-4" />
            导出
          </Button>
          <Button size="sm" variant="ghost" onClick={clearTerminal}>
            <Trash2 className="h-4 w-4" />
            清空
          </Button>
        </div>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto p-4 font-mono text-sm">
        {filteredLines.length === 0 ? (
          <p className="text-muted-foreground">
            {terminalLines.length === 0
              ? "暂无数据。打开串口后，接收数据会从 Rust 后端事件流进入这里。"
              : "没有匹配当前搜索和过滤条件的数据。"}
          </p>
        ) : (
          <div className="space-y-1">
            {filteredLines.map((line) => (
              <div
                key={line.id}
                className={
                  showTimestamps
                    ? "grid grid-cols-[88px_54px_1fr] gap-2"
                    : "grid grid-cols-[54px_1fr] gap-2"
                }
              >
                {showTimestamps && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(line.timestamp).toLocaleTimeString()}
                  </span>
                )}
                <span className={directionClass[line.direction]}>
                  {line.direction.toUpperCase()}
                </span>
                <span className="whitespace-pre-wrap break-all">{line.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
