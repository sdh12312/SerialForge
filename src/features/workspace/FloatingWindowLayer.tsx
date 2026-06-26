import type { ReactNode } from "react";

import { useWorkspaceStore, type WorkspacePanelId } from "../../stores/workspaceStore";
import { ModuleChrome } from "./DockableModule";

type FloatingWindowLayerProps = {
  renderPanel: (panelId: WorkspacePanelId) => ReactNode;
};

const floatingWindowStyles: Record<
  WorkspacePanelId,
  {
    left?: string;
    right?: string;
    top: string;
    width: string;
    height: string;
  }
> = {
  connections: { left: "24px", top: "82px", width: "300px", height: "560px" },
  terminal: { left: "340px", top: "82px", width: "720px", height: "420px" },
  sender: { left: "340px", top: "520px", width: "620px", height: "240px" },
  chart: { right: "28px", top: "82px", width: "520px", height: "260px" },
  virtual: { right: "28px", top: "360px", width: "390px", height: "360px" },
  tools: { right: "430px", top: "82px", width: "380px", height: "420px" },
  backend: { right: "430px", top: "520px", width: "320px", height: "220px" },
};

export function FloatingWindowLayer({ renderPanel }: FloatingWindowLayerProps) {
  const panels = useWorkspaceStore((state) => state.panels);
  const dockPanel = useWorkspaceStore((state) => state.dockPanel);
  const hidePanel = useWorkspaceStore((state) => state.hidePanel);
  const detachedPanels = Object.values(panels).filter((panel) => panel.visible && panel.detached);

  if (detachedPanels.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {detachedPanels.map((panel, index) => (
        <section
          key={panel.id}
          className="pointer-events-auto fixed flex min-h-[180px] min-w-[260px] resize overflow-auto rounded-2xl border border-border bg-background/95 p-2 shadow-2xl backdrop-blur"
          style={{ ...floatingWindowStyles[panel.id], zIndex: 50 + index }}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <ModuleChrome
              title={panel.title}
              floating
              onDock={() => dockPanel(panel.id)}
              onHide={() => hidePanel(panel.id)}
            />
            <div className="min-h-0 flex-1 overflow-auto">{renderPanel(panel.id)}</div>
          </div>
        </section>
      ))}
    </div>
  );
}
