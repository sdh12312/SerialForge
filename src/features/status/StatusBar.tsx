import { Badge } from "../../components/ui/badge";
import { useSerialStore } from "../../stores/serialStore";

export function StatusBar() {
  const { connections, activeConnectionId, terminalLines, hiddenLineCount } = useSerialStore();
  const activeConnection = connections.find((connection) => connection.id === activeConnectionId);
  const totalRx = connections.reduce((sum, connection) => sum + connection.rxBytes, 0);
  const totalTx = connections.reduce((sum, connection) => sum + connection.txBytes, 0);

  return (
    <footer className="flex h-9 shrink-0 items-center justify-between border-t border-border bg-panel px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>
          当前连接:{" "}
          <span className="font-mono text-foreground">{activeConnection?.displayName ?? "无"}</span>
        </span>
        <span>
          接收: <span className="font-mono text-foreground">{totalRx} B</span>
        </span>
        <span>
          发送: <span className="font-mono text-foreground">{totalTx} B</span>
        </span>
        <span>
          终端行: <span className="font-mono text-foreground">{terminalLines.length}</span>
        </span>
        <span>
          隐藏: <span className="font-mono text-foreground">{hiddenLineCount}</span>
        </span>
        <span>
          打开连接: <span className="font-mono text-foreground">{connections.length}</span>
        </span>
      </div>
      <Badge tone={activeConnection ? "success" : "warning"}>
        {activeConnection ? activeConnection.state : "未连接"}
      </Badge>
    </footer>
  );
}
