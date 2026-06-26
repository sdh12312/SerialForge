import { invoke } from "@tauri-apps/api/core";

import { isTauriRuntime } from "./runtime";

export type BackendStatus = {
  appName: string;
  backend: "rust" | "browser-preview";
  version: string;
  message: string;
  checkedAt: string;
};

export async function getBackendStatus(): Promise<BackendStatus> {
  if (isTauriRuntime()) {
    return invoke<BackendStatus>("backend_status");
  }

  return {
    appName: "SerialForge",
    backend: "browser-preview",
    version: "0.1.0",
    message: "当前运行在浏览器预览模式，Tauri 桌面壳启动后会调用 Rust 后端。",
    checkedAt: new Date().toISOString(),
  };
}
