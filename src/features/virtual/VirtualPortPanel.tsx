import { Cpu } from "lucide-react";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Panel } from "../../components/ui/panel";
import { useSerialStore } from "../../stores/serialStore";

export function VirtualPortPanel() {
  const {
    connections,
    activeConnectionId,
    virtualLinkConfig,
    createVirtualPair,
    closeVirtualPair,
    setActiveConnection,
    setVirtualLinkConfig,
  } = useSerialStore();
  const virtualConnections = connections.filter((connection) =>
    connection.id.startsWith("virtual_"),
  );

  return (
    <Panel className="module-resizable-x flex min-w-[280px] flex-col overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Cpu className="h-4 w-4 text-primary" />
          内置虚拟串口
        </h2>
        <p className="text-xs text-muted-foreground">应用内 Virtual Port A/B 回环测试工具</p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
        <section className="rounded-xl border border-border bg-background/70 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">虚拟串口对</span>
            <Badge tone={virtualConnections.length > 0 ? "success" : "default"}>
              {virtualConnections.length > 0 ? "已创建" : "阶段 4"}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            A 发送的数据由 B 接收，B 发送的数据由 A 接收，适合无硬件时做收发冒烟测试。
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <ConfigNumberInput
              label="延迟 ms"
              value={virtualLinkConfig.fixedDelayMs}
              min={0}
              max={10000}
              onChange={(value) => setVirtualLinkConfig({ fixedDelayMs: value })}
            />
            <ConfigNumberInput
              label="丢包 %"
              value={virtualLinkConfig.packetLossRate}
              min={0}
              max={100}
              onChange={(value) => setVirtualLinkConfig({ packetLossRate: value })}
            />
            <ConfigNumberInput
              label="损坏 %"
              value={virtualLinkConfig.corruptRate}
              min={0}
              max={100}
              onChange={(value) => setVirtualLinkConfig({ corruptRate: value })}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button size="sm" variant="secondary" onClick={createVirtualPair}>
              创建虚拟串口对
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={closeVirtualPair}
              disabled={virtualConnections.length === 0}
            >
              关闭虚拟串口对
            </Button>
          </div>
        </section>

        {virtualConnections.length > 0 && (
          <section className="rounded-xl border border-border bg-background/70 p-3">
            <span className="text-sm font-medium">虚拟端点</span>
            <div className="mt-2 space-y-1">
              {virtualConnections.map((connection) => (
                <button
                  key={connection.id}
                  className={
                    "w-full rounded-lg border px-3 py-2 text-left text-xs transition hover:bg-muted " +
                    (connection.id === activeConnectionId
                      ? "border-primary bg-primary/10"
                      : "border-border bg-panel")
                  }
                  onClick={() => setActiveConnection(connection.id)}
                >
                  <span className="font-medium">{connection.displayName}</span>
                  <span className="ml-2 text-muted-foreground">
                    RX {connection.rxBytes} B · TX {connection.txBytes} B
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </Panel>
  );
}

function ConfigNumberInput({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-1 text-xs text-muted-foreground">
      <span>{label}</span>
      <input
        className="h-8 w-full rounded-lg border border-border bg-panel px-2 text-xs text-foreground outline-none"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          if (!Number.isNaN(nextValue)) {
            onChange(Math.max(min, Math.min(max, nextValue)));
          }
        }}
      />
    </label>
  );
}
