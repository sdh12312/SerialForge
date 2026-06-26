import { Activity, Download, Moon, Plus, Settings, Sun, Upload } from "lucide-react";
import { useEffect } from "react";

import { Button } from "../components/ui/button";
import { Panel } from "../components/ui/panel";
import { BackendPingCard } from "../features/backend/BackendPingCard";
import { RealtimeChartPanel } from "../features/charts/RealtimeChartPanel";
import { ConnectionSidebar } from "../features/connections/ConnectionSidebar";
import { SenderPanel } from "../features/sender/SenderPanel";
import { StatusBar } from "../features/status/StatusBar";
import { TerminalView } from "../features/terminal/TerminalView";
import { ToolPanel } from "../features/tools/ToolPanel";
import { WorkspaceTabs } from "../features/workspace/WorkspaceTabs";
import { useSerialEvents } from "../hooks/useSerialEvents";
import { useThemeStore } from "../stores/themeStore";

export function AppShell() {
  const { theme, toggleTheme, hydrateTheme } = useThemeStore();
  useSerialEvents();

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  return (
    <div className="flex h-full min-h-[720px] min-w-[1120px] flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-panel px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">SerialForge</h1>
            <p className="text-xs text-muted-foreground">默认工作区 · 阶段 1 骨架</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            新建连接
          </Button>
          <Button size="sm" variant="secondary">
            <Upload className="h-4 w-4" />
            导入
          </Button>
          <Button size="sm" variant="secondary">
            <Download className="h-4 w-4" />
            导出
          </Button>
          <Button size="icon" variant="ghost" aria-label="设置">
            <Settings className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" aria-label="切换主题" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </nav>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-[280px_minmax(520px,1fr)_340px] gap-3 p-3">
        <ConnectionSidebar />
        <Panel className="flex min-w-[520px] flex-col overflow-hidden">
          <WorkspaceTabs />
          <section className="grid min-h-0 flex-1 grid-rows-[minmax(220px,1fr)_190px_220px] gap-3 p-3">
            <TerminalView />
            <RealtimeChartPanel />
            <div className="grid grid-cols-[1fr_280px] gap-3">
              <SenderPanel />
              <BackendPingCard />
            </div>
          </section>
        </Panel>
        <ToolPanel />
      </main>

      <StatusBar />
    </div>
  );
}
