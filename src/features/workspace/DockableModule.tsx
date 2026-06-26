import { EyeOff, PanelTopClose, PanelTopOpen } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "../../components/ui/button";
import { useWorkspaceStore, type WorkspacePanelId } from "../../stores/workspaceStore";
import { cn } from "../../utils/cn";

type DockableModuleProps = {
  panelId: WorkspacePanelId;
  className?: string;
  children: ReactNode;
};

export function DockableModule({ panelId, className, children }: DockableModuleProps) {
  const panel = useWorkspaceStore((state) => state.panels[panelId]);
  const detachPanel = useWorkspaceStore((state) => state.detachPanel);
  const hidePanel = useWorkspaceStore((state) => state.hidePanel);

  if (!panel.visible || panel.detached) {
    return null;
  }

  return (
    <div className={cn("flex min-h-0 flex-col gap-1", className)}>
      <ModuleChrome
        title={panel.title}
        onDetach={() => detachPanel(panelId)}
        onHide={() => hidePanel(panelId)}
      />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

export function ModuleChrome({
  title,
  floating = false,
  onDock,
  onDetach,
  onHide,
}: {
  title: string;
  floating?: boolean;
  onDock?: () => void;
  onDetach?: () => void;
  onHide: () => void;
}) {
  return (
    <div className="flex h-8 shrink-0 items-center justify-between rounded-xl border border-border bg-panel/95 px-2 text-xs shadow-panel">
      <span className="truncate font-medium text-muted-foreground">{title}</span>
      <span className="flex items-center gap-1">
        {floating ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onDock}
            title="吸附回主窗口"
          >
            <PanelTopClose className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onDetach}
            title="拆分为单独窗口"
          >
            <PanelTopOpen className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onHide} title="隐藏窗口">
          <EyeOff className="h-3.5 w-3.5" />
        </Button>
      </span>
    </div>
  );
}
