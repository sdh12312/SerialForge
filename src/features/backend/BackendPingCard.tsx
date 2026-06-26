import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { getBackendStatus, type BackendStatus } from "../../services/backend";
import { isTauriRuntime } from "../../services/runtime";

export function BackendPingCard() {
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isDesktopRuntime = isTauriRuntime();
  const isRustBackendVerified = status?.backend === "rust";

  async function handlePing() {
    setLoading(true);
    setError(null);

    try {
      setStatus(await getBackendStatus());
    } catch (currentError) {
      const message =
        currentError instanceof Error ? currentError.message : "无法调用 Rust 后端测试命令";
      setError(message);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="module-resizable rounded-xl border border-border bg-background/70 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">后端通信</h3>
        <Badge tone={isRustBackendVerified ? "success" : "warning"}>
          {isRustBackendVerified ? "Rust 已验证" : isDesktopRuntime ? "待验证" : "浏览器预览"}
        </Badge>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        {isDesktopRuntime
          ? "通过 Tauri invoke 调用 Rust 命令。点击按钮可验证桌面后端。"
          : "当前运行在浏览器预览模式，只能显示前端回退状态，不能扫描或打开物理串口。"}
      </p>
      <Button className="w-full" size="sm" onClick={handlePing} disabled={loading}>
        <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        {loading ? "验证中" : isDesktopRuntime ? "测试后端" : "查看当前模式"}
      </Button>
      {status && (
        <pre className="mt-3 overflow-auto rounded-lg bg-muted p-2 font-mono text-xs">
          {JSON.stringify(status, null, 2)}
        </pre>
      )}
      {error && <p className="mt-3 text-xs text-danger">{error}</p>}
    </section>
  );
}
