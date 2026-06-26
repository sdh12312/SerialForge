import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";

import { isTauriRuntime } from "../services/runtime";
import type { SerialDataEvent, SerialStatusEvent } from "../services/serial";
import { useSerialStore } from "../stores/serialStore";

export function useSerialEvents() {
  const appendRx = useSerialStore((state) => state.appendRx);
  const applyStatus = useSerialStore((state) => state.applyStatus);

  useEffect(() => {
    if (!isTauriRuntime()) {
      return undefined;
    }

    const unlistenData = listen<SerialDataEvent>("serial-data", (event) => {
      appendRx(event.payload);
    });
    const unlistenStatus = listen<SerialStatusEvent>("serial-status", (event) => {
      applyStatus(event.payload);
    });

    return () => {
      void unlistenData.then((unlisten) => unlisten());
      void unlistenStatus.then((unlisten) => unlisten());
    };
  }, [appendRx, applyStatus]);
}
