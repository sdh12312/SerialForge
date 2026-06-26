import { create } from "zustand";

export type WorkspaceTab = {
  id: string;
  title: string;
  connectionId: string | null;
};

type WorkspaceState = {
  tabs: WorkspaceTab[];
  activeTabId: string;
  addTab: (tab: WorkspaceTab) => void;
  closeTab: (tabId: string) => void;
};

const defaultTab: WorkspaceTab = {
  id: "default",
  title: "默认会话",
  connectionId: null,
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  tabs: [defaultTab],
  activeTabId: defaultTab.id,
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
}));
