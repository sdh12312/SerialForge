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
import { VirtualPortPanel } from "../features/virtual/VirtualPortPanel";
import { DockableModule } from "../features/workspace/DockableModule";
import { FloatingWindowLayer } from "../features/workspace/FloatingWindowLayer";
import { WindowMenu } from "../features/workspace/WindowMenu";
import { WorkspaceTabs } from "../features/workspace/WorkspaceTabs";
import { useSerialEvents } from "../hooks/useSerialEvents";
import { useThemeStore } from "../stores/themeStore";
import { useWorkspaceStore, type WorkspacePanelId } from "../stores/workspaceStore";

export function AppShell() {
  const { theme, toggleTheme, hydrateTheme } = useThemeStore();
  const panels = useWorkspaceStore((state) => state.panels);
  const showBottomDock =
    isDockedPanelVisible(panels.sender) || isDockedPanelVisible(panels.backend);
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
            <p className="text-xs text-muted-foreground">默认工作区 · 阶段 9 窗口管理</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <WindowMenu />
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

      <main
        className="grid min-h-0 flex-1 gap-3 p-3"
        style={{ gridTemplateColumns: buildMainColumns(panels) }}
      >
        <DockableModule panelId="connections">
          <ConnectionSidebar />
        </DockableModule>
        <Panel className="flex min-w-[520px] flex-col overflow-hidden">
          <WorkspaceTabs />
          <section className="flex min-h-0 flex-1 flex-col gap-2 p-3">
            <DockableModule panelId="terminal" className="flex-[1_1_auto]">
              <TerminalView />
            </DockableModule>
            <DockableModule panelId="chart" className="min-h-[150px] flex-[0_0_170px]">
              <RealtimeChartPanel />
            </DockableModule>
            {showBottomDock && (
              <div
                className="grid min-h-[180px] flex-[0_0_205px] gap-2"
                style={{ gridTemplateColumns: buildBottomColumns(panels) }}
              >
                <DockableModule panelId="sender">
                  <SenderPanel />
                </DockableModule>
                <DockableModule panelId="backend">
                  <BackendPingCard />
                </DockableModule>
              </div>
            )}
          </section>
        </Panel>
        {showSideDock(panels) && (
          <aside className="flex min-h-0 flex-col gap-2 overflow-hidden">
            <DockableModule panelId="virtual">
              <VirtualPortPanel />
            </DockableModule>
            <DockableModule panelId="tools">
              <ToolPanel />
            </DockableModule>
          </aside>
        )}
      </main>

      <FloatingWindowLayer renderPanel={renderWorkspacePanel} />
      <StatusBar />
    </div>
  );
}

function buildMainColumns(panels: ReturnType<typeof useWorkspaceStore.getState>["panels"]): string {
  const columns = [];

  if (panels.connections.visible && !panels.connections.detached) {
    columns.push("250px");
  }

  columns.push("minmax(620px,1fr)");

  if (showSideDock(panels)) {
    columns.push("320px");
  }

  return columns.join(" ");
}

function showSideDock(panels: ReturnType<typeof useWorkspaceStore.getState>["panels"]): boolean {
  return isDockedPanelVisible(panels.virtual) || isDockedPanelVisible(panels.tools);
}

function buildBottomColumns(
  panels: ReturnType<typeof useWorkspaceStore.getState>["panels"],
): string {
  if (isDockedPanelVisible(panels.sender) && isDockedPanelVisible(panels.backend)) {
    return "minmax(0,1fr) 260px";
  }

  return "minmax(0,1fr)";
}

function isDockedPanelVisible(panel: { visible: boolean; detached: boolean }): boolean {
  return panel.visible && !panel.detached;
}

function renderWorkspacePanel(panelId: WorkspacePanelId) {
  switch (panelId) {
    case "connections":
      return <ConnectionSidebar />;
    case "terminal":
      return <TerminalView />;
    case "sender":
      return <SenderPanel />;
    case "chart":
      return <RealtimeChartPanel />;
    case "virtual":
      return <VirtualPortPanel />;
    case "tools":
      return <ToolPanel />;
    case "backend":
      return <BackendPingCard />;
  }
}
