import { describe, expect, it } from "vitest";

import { useWorkspaceStore } from "./workspaceStore";

describe("工作区状态", () => {
  it("添加标签页并避免重复 id", () => {
    useWorkspaceStore.setState({
      tabs: [{ id: "default", title: "默认会话", connectionId: null }],
      activeTabId: "default",
    });

    useWorkspaceStore.getState().addTab({ id: "a", title: "COM1", connectionId: "conn-a" });
    useWorkspaceStore
      .getState()
      .addTab({ id: "a", title: "COM1 duplicate", connectionId: "conn-a" });

    expect(useWorkspaceStore.getState().tabs).toHaveLength(2);
    expect(useWorkspaceStore.getState().activeTabId).toBe("a");
  });
});
