import { Check, LayoutPanelLeft, RotateCcw } from "lucide-react";
import { useState } from "react";

import { Button } from "../../components/ui/button";
import {
  useWorkspaceStore,
  type WorkspacePanelId,
  type WorkspacePanelState,
} from "../../stores/workspaceStore";

const panelOrder: WorkspacePanelId[] = [
  "connections",
  "terminal",
  "sender",
  "chart",
  "virtual",
  "tools",
  "backend",
];

export function WindowMenu() {
  const [open, setOpen] = useState(false);
  const panels = useWorkspaceStore((state) => state.panels);
  const togglePanelVisible = useWorkspaceStore((state) => state.togglePanelVisible);
  const detachPanel = useWorkspaceStore((state) => state.detachPanel);
  const dockPanel = useWorkspaceStore((state) => state.dockPanel);
  const resetPanels = useWorkspaceStore((state) => state.resetPanels);

  return (
    <div className="relative">
      <Button size="sm" variant="secondary" onClick={() => setOpen((value) => !value)}>
        <LayoutPanelLeft className="h-4 w-4" />
        窗口
      </Button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-2xl border border-border bg-panel p-2 text-sm shadow-2xl">
          <div className="mb-1 px-2 py-1 text-xs text-muted-foreground">
            选择显示窗口，也可以拆分为浮动窗口
          </div>
          <div className="space-y-1">
            {panelOrder.map((panelId) => (
              <WindowMenuItem
                key={panelId}
                panel={panels[panelId]}
                onToggle={() => togglePanelVisible(panelId)}
                onDetach={() => detachPanel(panelId)}
                onDock={() => dockPanel(panelId)}
              />
            ))}
          </div>
          <button
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-muted-foreground hover:bg-muted"
            onClick={() => {
              resetPanels();
              setOpen(false);
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            恢复简洁默认布局
          </button>
        </div>
      )}
    </div>
  );
}

function WindowMenuItem({
  panel,
  onToggle,
  onDetach,
  onDock,
}: {
  panel: WorkspacePanelState;
  onToggle: () => void;
  onDetach: () => void;
  onDock: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/70 p-2">
      <button className="flex w-full items-center justify-between text-left" onClick={onToggle}>
        <span className="flex items-center gap-2">
          <span className="flex h-4 w-4 items-center justify-center rounded border border-border">
            {panel.visible && <Check className="h-3 w-3 text-primary" />}
          </span>
          {panel.title}
        </span>
        <span className="text-xs text-muted-foreground">
          {panel.visible ? (panel.detached ? "已拆分" : "已吸附") : "隐藏"}
        </span>
      </button>
      {panel.visible && (
        <button
          className="mt-2 w-full rounded-lg border border-border bg-panel px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
          onClick={panel.detached ? onDock : onDetach}
        >
          {panel.detached ? "吸附回主窗口" : "拆分为单独窗口"}
        </button>
      )}
    </div>
  );
}
