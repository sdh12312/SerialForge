import { Bot, FileJson, Gauge, ListChecks, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "../../components/ui/badge";
import { Panel } from "../../components/ui/panel";
import { useSerialStore } from "../../stores/serialStore";
import { AutomationPanel } from "../automation/AutomationPanel";
import { BridgePanel } from "../automation/BridgePanel";
import {
  calculateChecksums,
  parseProtocolFrame,
  type ProtocolFieldDefinition,
} from "../protocol/protocolTools";
import { summarizeTerminalLines } from "../terminal/terminalFilters";

const tools = [
  { name: "串口配置", icon: Settings2, state: "阶段 2" },
  { name: "命令列表", icon: ListChecks, state: "阶段 5" },
  { name: "虚拟设备", icon: Bot, state: "阶段 4" },
];

export function ToolPanel() {
  const { terminalLines, hiddenLineCount } = useSerialStore();
  const [protocolHex, setProtocolHex] = useState("AA 55 34 12 4F 4B");
  const [fieldConfig, setFieldConfig] = useState(
    '[{"name":"header","offset":0,"length":2,"type":"hex"},{"name":"value","offset":2,"length":2,"type":"uint16le"},{"name":"text","offset":4,"length":2,"type":"ascii"}]',
  );
  const stats = summarizeTerminalLines(terminalLines, hiddenLineCount);
  const protocolResult = useMemo(() => {
    try {
      const fields = JSON.parse(fieldConfig) as ProtocolFieldDefinition[];
      return {
        checksums: calculateChecksums(protocolHex),
        fields: parseProtocolFrame(protocolHex, fields),
        error: null,
      };
    } catch (error) {
      return {
        checksums: null,
        fields: [],
        error: error instanceof Error ? error.message : "协议配置解析失败",
      };
    }
  }, [fieldConfig, protocolHex]);

  return (
    <Panel className="module-resizable-x flex min-w-[300px] flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">工具面板</h2>
        <p className="text-xs text-muted-foreground">
          阶段 3/6 已启用统计与协议解析，未完成项继续标记
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
        <section className="rounded-xl border border-border bg-background/70 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Gauge className="h-4 w-4 text-primary" />
              会话统计
            </span>
            <Badge tone="success">阶段 3</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <StatCard label="终端行" value={stats.total} />
            <StatCard label="连接数" value={stats.connectionCount} />
            <StatCard label="RX 行" value={stats.rx} />
            <StatCard label="TX 行" value={stats.tx} />
            <StatCard label="RX 字节" value={stats.rxBytes + " B"} />
            <StatCard label="TX 字节" value={stats.txBytes + " B"} />
            <StatCard label="系统事件" value={stats.system} />
            <StatCard label="隐藏行" value={stats.hidden} />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-background/70 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium">
              <FileJson className="h-4 w-4 text-primary" />
              协议解析
            </span>
            <Badge tone="success">阶段 6</Badge>
          </div>
          <label className="space-y-1 text-xs text-muted-foreground">
            <span>HEX 帧</span>
            <textarea
              className="h-16 w-full resize-y rounded-lg border border-border bg-panel p-2 font-mono text-xs text-foreground outline-none"
              value={protocolHex}
              onChange={(event) => setProtocolHex(event.target.value)}
            />
          </label>
          <label className="mt-2 block space-y-1 text-xs text-muted-foreground">
            <span>字段 JSON</span>
            <textarea
              className="h-24 w-full resize-y rounded-lg border border-border bg-panel p-2 font-mono text-xs text-foreground outline-none"
              value={fieldConfig}
              onChange={(event) => setFieldConfig(event.target.value)}
            />
          </label>
          {protocolResult.error ? (
            <p className="mt-2 rounded-lg border border-danger/30 bg-danger/10 p-2 text-xs text-danger">
              {protocolResult.error}
            </p>
          ) : (
            <div className="mt-3 space-y-2 text-xs">
              {protocolResult.checksums && (
                <div className="grid grid-cols-3 gap-2">
                  <StatCard label="SUM8" value={protocolResult.checksums.sum8} />
                  <StatCard label="XOR8" value={protocolResult.checksums.xor8} />
                  <StatCard label="CRC16" value={protocolResult.checksums.crc16Modbus} />
                </div>
              )}
              <div className="space-y-1">
                {protocolResult.fields.map((field) => (
                  <div
                    key={field.name}
                    className="rounded-lg border border-border bg-panel px-2 py-1"
                  >
                    <span className="font-medium text-foreground">{field.name}</span>
                    <span className="ml-2 font-mono text-muted-foreground">{field.rawHex}</span>
                    <span className="ml-2 font-mono text-primary">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <AutomationPanel />
        <BridgePanel />

        {tools.map((tool) => (
          <button
            key={tool.name}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-background/70 px-3 py-3 text-left transition hover:bg-muted"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <tool.icon className="h-4 w-4 text-primary" />
              {tool.name}
            </span>
            <Badge>{tool.state}</Badge>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-panel px-3 py-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}
