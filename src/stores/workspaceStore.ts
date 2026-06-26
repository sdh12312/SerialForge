import { create } from "zustand";

export type WorkspaceTab = {
  id: string;
  title: string;
  connectionId: string | null;
};

export type WorkspacePanelId =
  | "connections"
  | "terminal"
  | "sender"
  | "chart"
  | "virtual"
  | "tools"
  | "backend";

export type WorkspacePanelState = {
  id: WorkspacePanelId;
  title: string;
  visible: boolean;
  detached: boolean;
};

type WorkspaceState = {
  tabs: WorkspaceTab[];
  activeTabId: string;
  panels: Record<WorkspacePanelId, WorkspacePanelState>;
  addTab: (tab: WorkspaceTab) => void;
  closeTab: (tabId: string) => void;
  setPanelVisible: (panelId: WorkspacePanelId, visible: boolean) => void;
  togglePanelVisible: (panelId: WorkspacePanelId) => void;
  detachPanel: (panelId: WorkspacePanelId) => void;
  dockPanel: (panelId: WorkspacePanelId) => void;
  hidePanel: (panelId: WorkspacePanelId) => void;
  resetPanels: () => void;
};

const defaultTab: WorkspaceTab = {
  id: "default",
  title: "默认会话",
  connectionId: null,
};

export const defaultPanels: Record<WorkspacePanelId, WorkspacePanelState> = {
  connections: { id: "connections", title: "连接", visible: true, detached: false },
  terminal: { id: "terminal", title: "接收区", visible: true, detached: false },
  sender: { id: "sender", title: "发送区", visible: true, detached: false },
  chart: { id: "chart", title: "实时曲线", visible: false, detached: false },
  virtual: { id: "virtual", title: "虚拟串口", visible: false, detached: false },
  tools: { id: "tools", title: "工具面板", visible: false, detached: false },
  backend: { id: "backend", title: "后端状态", visible: false, detached: false },
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  tabs: [defaultTab],
  activeTabId: defaultTab.id,
  panels: defaultPanels,
  addTab: (tab) =>
    set((state) => ({
      tabs: state.tabs.some((current) => current.id === tab.id) ? state.tabs : [...state.tabs, tab],
      activeTabId: tab.id,
    })),
  closeTab: (tabId) => {
    const nextTabs = get().tabs.filter((tab) => tab.id !== tabId);
    const safeTabs = nextTabs.length > 0 ? nextTabs : [defaultTab];
    set({
      tabs: safeTabs,
      activeTabId: safeTabs[0]?.id ?? defaultTab.id,
    });
  },
  setPanelVisible: (panelId, visible) =>
    set((state) => ({
      panels: {
        ...state.panels,
        [panelId]: {
          ...state.panels[panelId],
          visible,
          detached: visible ? state.panels[panelId].detached : false,
        },
      },
    })),
  togglePanelVisible: (panelId) => {
    const panel = get().panels[panelId];
    get().setPanelVisible(panelId, !panel.visible);
  },
  detachPanel: (panelId) =>
    set((state) => ({
      panels: {
        ...state.panels,
        [panelId]: { ...state.panels[panelId], visible: true, detached: true },
      },
    })),
  dockPanel: (panelId) =>
    set((state) => ({
      panels: {
        ...state.panels,
        [panelId]: { ...state.panels[panelId], visible: true, detached: false },
      },
    })),
  hidePanel: (panelId) =>
    set((state) => ({
      panels: {
        ...state.panels,
        [panelId]: { ...state.panels[panelId], visible: false, detached: false },
      },
    })),
  resetPanels: () => set({ panels: defaultPanels }),
}));
