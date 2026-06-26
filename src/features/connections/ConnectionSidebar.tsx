import { ChevronDown, Link2, RefreshCw, Usb } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Panel } from "../../components/ui/panel";
import { isTauriRuntime } from "../../services/runtime";
import { useSerialStore } from "../../stores/serialStore";
import type { SerialConfig } from "../../services/serial";

const baudRates = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];
const dataBits = [5, 6, 7, 8];
const stopBits = [1, 2];

export function ConnectionSidebar() {
  const isDesktopRuntime = isTauriRuntime();
  const {
    ports,
    connections,
    activeConnectionId,
    serialConfig,
    loading,
    error,
    refreshPorts,
    openPort,
    closeConnection,
    closeActiveConnection,
    setActiveConnection,
    setSerialConfig,
  } = useSerialStore();

  useEffect(() => {
    void refreshPorts();
  }, [refreshPorts]);

  return (
    <Panel className="flex min-w-[230px] flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">连接</h2>
          <p className="text-xs text-muted-foreground">阶段 2：物理串口核心</p>
        </div>
        <Badge tone={connections.length > 0 ? "success" : "warning"}>
          {connections.length > 0 ? "已连接" : isDesktopRuntime ? "离线" : "浏览器预览"}
        </Badge>
      </div>

      <div className="space-y-2 border-b border-border p-3">
        <Button
          className="w-full"
          size="sm"
          variant="secondary"
          onClick={refreshPorts}
          disabled={loading || !isDesktopRuntime}
        >
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          {isDesktopRuntime ? "刷新串口" : "桌面模式可刷新"}
        </Button>
        <Button
          className="w-full"
          size="sm"
          variant="ghost"
          onClick={closeActiveConnection}
          disabled={!activeConnectionId || loading}
        >
          关闭当前连接
        </Button>
        {error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 p-2 text-xs text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
        <section className="rounded-xl border border-border bg-background/70 p-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">串口参数</span>
            <Badge>阶段 2</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ConfigSelect
              label="波特率"
              value={String(serialConfig.baudRate)}
              onChange={(value) => setSerialConfig({ baudRate: Number(value) })}
            >
              {baudRates.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}
                </option>
              ))}
            </ConfigSelect>
            <ConfigSelect
              label="数据位"
              value={String(serialConfig.dataBits)}
              onChange={(value) => setSerialConfig({ dataBits: Number(value) })}
            >
              {dataBits.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </ConfigSelect>
            <ConfigSelect
              label="停止位"
              value={String(serialConfig.stopBits)}
              onChange={(value) => setSerialConfig({ stopBits: Number(value) })}
            >
              {stopBits.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </ConfigSelect>
            <ConfigSelect
              label="校验"
              value={serialConfig.parity}
              onChange={(value) => setSerialConfig({ parity: value as SerialConfig["parity"] })}
            >
              <option value="none">None</option>
              <option value="odd">Odd</option>
              <option value="even">Even</option>
            </ConfigSelect>
            <ConfigSelect
              label="流控"
              value={serialConfig.flowControl}
              onChange={(value) =>
                setSerialConfig({ flowControl: value as SerialConfig["flowControl"] })
              }
            >
              <option value="none">None</option>
              <option value="software">XON/XOFF</option>
              <option value="hardware">RTS/CTS</option>
            </ConfigSelect>
            <div className="grid grid-cols-2 gap-2">
              <ConfigCheckbox
                label="DTR"
                checked={serialConfig.dtr}
                onChange={(checked) => setSerialConfig({ dtr: checked })}
              />
              <ConfigCheckbox
                label="RTS"
                checked={serialConfig.rts}
                onChange={(checked) => setSerialConfig({ rts: checked })}
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-background/70">
          <button className="flex w-full items-center justify-between px-3 py-2 text-left">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Usb className="h-4 w-4 text-primary" />
              物理串口连接
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="space-y-1 px-2 pb-2">
            {!isDesktopRuntime ? (
              <div className="mx-1 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                <p className="font-medium">当前是浏览器预览，无法访问 Windows 物理串口。</p>
                <p className="mt-1 text-muted-foreground">
                  请使用 npm.cmd run tauri:dev 启动桌面壳，或运行 release\\SerialForge.exe
                  后再刷新串口。
                </p>
              </div>
            ) : ports.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                未发现串口。请确认设备管理器中存在 COM 口，且未被其他软件占用。
              </p>
            ) : (
              ports.map((port) => (
                <button
                  key={port.portName}
                  className={
                    "w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted " +
                    (port.isOpen ? "border border-success/30 bg-success/10" : "")
                  }
                  onClick={() => void openPort(port.portName)}
                  disabled={loading}
                >
                  <span className="flex items-center justify-between gap-2 font-medium">
                    {port.displayName}
                    {port.isOpen && <Badge tone="success">已打开</Badge>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {port.portType}
                    {port.manufacturer ? " · " + port.manufacturer : ""}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-background/70">
          <button className="flex w-full items-center justify-between px-3 py-2 text-left">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Link2 className="h-4 w-4 text-primary" />
              已打开连接
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="space-y-1 px-2 pb-2">
            {connections.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">暂无打开的连接</p>
            ) : (
              connections.map((connection) => (
                <button
                  key={connection.id}
                  className={
                    "w-full rounded-lg border px-3 py-2 text-left text-sm transition hover:bg-muted " +
                    (connection.id === activeConnectionId
                      ? "border-primary bg-primary/10"
                      : "border-border bg-panel")
                  }
                  onClick={() => setActiveConnection(connection.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{connection.displayName}</span>
                    <Badge tone={connection.state === "open" ? "success" : "danger"}>
                      {connection.state}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    RX {connection.rxBytes} B · TX {connection.txBytes} B
                  </p>
                  <Button
                    className="mt-2 w-full"
                    size="sm"
                    variant="ghost"
                    onClick={(event) => {
                      event.stopPropagation();
                      void closeConnection(connection.id);
                    }}
                    disabled={loading}
                  >
                    关闭此连接
                  </Button>
                </button>
              ))
            )}
          </div>
        </section>
      </div>
    </Panel>
  );
}

function ConfigSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1 text-xs text-muted-foreground">
      <span>{label}</span>
      <select
        className="h-8 w-full rounded-lg border border-border bg-panel px-2 text-xs text-foreground outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function ConfigCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-full items-end gap-2 rounded-lg border border-border bg-panel px-2 py-2 text-xs">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
