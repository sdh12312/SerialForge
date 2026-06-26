import { create, type StateCreator } from "zustand";

import {
  closeSerialConnection,
  defaultSerialConfig,
  getSerialErrorMessage,
  listSerialPorts,
  openSerialConnection,
  renderSerialData,
  sendSerialHex,
  sendSerialText,
  type ConnectionSnapshot,
  type SerialDataEvent,
  type SerialConfig,
  type SerialPortSummary,
  type SerialStatusEvent,
} from "../services/serial";
import { parseHexInput } from "../utils/hex";

export type TerminalLine = {
  id: string;
  connectionId: string;
  direction: "rx" | "tx" | "system";
  content: string;
  timestamp: string;
  byteLength?: number;
};

type SendMode = "text" | "hex";
type DisplayMode = "text" | "hex" | "mixed";
export type DirectionFilter = "all" | "rx" | "tx" | "system";
export type LineEnding = "none" | "cr" | "lf" | "crlf";
export type VirtualLinkConfig = {
  fixedDelayMs: number;
  packetLossRate: number;
  corruptRate: number;
};

type SerialState = {
  ports: SerialPortSummary[];
  connections: ConnectionSnapshot[];
  activeConnectionId: string | null;
  serialConfig: SerialConfig;
  terminalLines: TerminalLine[];
  sendMode: SendMode;
  displayMode: DisplayMode;
  directionFilter: DirectionFilter;
  searchQuery: string;
  terminalPaused: boolean;
  autoScroll: boolean;
  showTimestamps: boolean;
  hiddenLineCount: number;
  lineEnding: LineEnding;
  virtualLinkConfig: VirtualLinkConfig;
  sendHistory: string[];
  loading: boolean;
  error: string | null;
  refreshPorts: () => Promise<void>;
  openPort: (portName: string) => Promise<void>;
  createVirtualPair: () => void;
  closeVirtualPair: () => void;
  closeConnection: (connectionId: string) => Promise<void>;
  closeActiveConnection: () => Promise<void>;
  send: (payload: string) => Promise<void>;
  appendRx: (event: SerialDataEvent) => void;
  applyStatus: (event: SerialStatusEvent) => void;
  setActiveConnection: (connectionId: string) => void;
  setSerialConfig: (config: Partial<SerialConfig>) => void;
  setVirtualLinkConfig: (config: Partial<VirtualLinkConfig>) => void;
  setSendMode: (mode: SendMode) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setDirectionFilter: (filter: DirectionFilter) => void;
  setSearchQuery: (query: string) => void;
  setTerminalPaused: (paused: boolean) => void;
  setAutoScroll: (enabled: boolean) => void;
  setShowTimestamps: (enabled: boolean) => void;
  setLineEnding: (lineEnding: LineEnding) => void;
  clearTerminal: () => void;
};

const maxTerminalLines = 1000;

export const useSerialStore = create<SerialState>((set, get) => ({
  ports: [],
  connections: [],
  activeConnectionId: null,
  serialConfig: defaultSerialConfig,
  terminalLines: [],
  sendMode: "text",
  displayMode: "text",
  directionFilter: "all",
  searchQuery: "",
  terminalPaused: false,
  autoScroll: true,
  showTimestamps: true,
  hiddenLineCount: 0,
  lineEnding: "none",
  virtualLinkConfig: {
    fixedDelayMs: 0,
    packetLossRate: 0,
    corruptRate: 0,
  },
  sendHistory: [],
  loading: false,
  error: null,
  refreshPorts: async () => {
    set({ loading: true, error: null });
    try {
      const ports = await listSerialPorts();
      set((state) => ({
        ports: markOpenPorts(ports, state.connections),
        loading: false,
      }));
    } catch (error) {
      set({ error: getSerialErrorMessage(error), loading: false });
    }
  },
  openPort: async (portName) => {
    const existingConnection = get().connections.find(
      (connection) => connection.portName === portName,
    );
    if (existingConnection) {
      set({ activeConnectionId: existingConnection.id, error: null });
      return;
    }

    set({ loading: true, error: null });
    try {
      const { serialConfig } = get();
      const connection = await openSerialConnection(portName, serialConfig);
      set((state) => ({
        connections: [...state.connections.filter((item) => item.id !== connection.id), connection],
        activeConnectionId: connection.id,
        ports: markOpenPorts(state.ports, [...state.connections, connection]),
        loading: false,
        terminalLines: appendLine(state.terminalLines, {
          id: crypto.randomUUID(),
          connectionId: connection.id,
          direction: "system",
          content: "已打开 " + connection.portName + " @ " + serialConfig.baudRate,
          timestamp: new Date().toISOString(),
        }),
      }));
    } catch (error) {
      set({ error: getSerialErrorMessage(error), loading: false });
    }
  },
  createVirtualPair: () =>
    set((state) => {
      const existingVirtualConnections = state.connections.filter((connection) =>
        isVirtualConnection(connection.id),
      );
      if (existingVirtualConnections.length > 0) {
        return {
          activeConnectionId: existingVirtualConnections[0]?.id ?? state.activeConnectionId,
          error: null,
        };
      }

      const virtualA = createVirtualConnection("virtual_a", "Virtual Port A");
      const virtualB = createVirtualConnection("virtual_b", "Virtual Port B");

      return {
        connections: [...state.connections, virtualA, virtualB],
        activeConnectionId: virtualA.id,
        error: null,
        terminalLines: appendLine(state.terminalLines, {
          id: crypto.randomUUID(),
          connectionId: virtualA.id,
          direction: "system",
          content: "已创建内置虚拟串口对：Virtual Port A ↔ Virtual Port B",
          timestamp: new Date().toISOString(),
        }),
      };
    }),
  closeVirtualPair: () =>
    set((state) => {
      const virtualIds = new Set(
        state.connections
          .filter((connection) => isVirtualConnection(connection.id))
          .map((connection) => connection.id),
      );

      return {
        connections: state.connections.filter((connection) => !virtualIds.has(connection.id)),
        activeConnectionId: virtualIds.has(state.activeConnectionId ?? "")
          ? null
          : state.activeConnectionId,
        terminalLines: appendLine(state.terminalLines, {
          id: crypto.randomUUID(),
          connectionId: "virtual",
          direction: "system",
          content: "已关闭内置虚拟串口对",
          timestamp: new Date().toISOString(),
        }),
      };
    }),
  closeConnection: async (connectionId) => {
    if (isVirtualConnection(connectionId)) {
      set((state) => {
        const nextConnections = state.connections.filter(
          (connection) => connection.id !== connectionId,
        );
        return {
          connections: nextConnections,
          activeConnectionId:
            state.activeConnectionId === connectionId
              ? (nextConnections.find((connection) => connection.state === "open")?.id ?? null)
              : state.activeConnectionId,
          terminalLines: appendLine(state.terminalLines, {
            id: crypto.randomUUID(),
            connectionId,
            direction: "system",
            content: "虚拟连接已关闭",
            timestamp: new Date().toISOString(),
          }),
        };
      });
      return;
    }

    set({ loading: true, error: null });
    try {
      await closeSerialConnection(connectionId);
      set((state) => {
        const nextConnections = state.connections.filter(
          (connection) => connection.id !== connectionId,
        );
        const nextActiveConnectionId =
          state.activeConnectionId === connectionId
            ? (nextConnections.find((connection) => connection.state === "open")?.id ?? null)
            : state.activeConnectionId;

        return {
          connections: nextConnections,
          activeConnectionId: nextActiveConnectionId,
          ports: markOpenPorts(state.ports, nextConnections),
          loading: false,
          terminalLines: appendLine(state.terminalLines, {
            id: crypto.randomUUID(),
            connectionId,
            direction: "system",
            content: "连接已关闭",
            timestamp: new Date().toISOString(),
          }),
        };
      });
    } catch (error) {
      set({ error: getSerialErrorMessage(error), loading: false });
    }
  },
  closeActiveConnection: async () => {
    const { activeConnectionId } = get();
    if (!activeConnectionId) {
      return;
    }

    await get().closeConnection(activeConnectionId);
  },
  send: async (payload) => {
    const { activeConnectionId, sendMode, lineEnding } = get();
    if (!activeConnectionId || payload.length === 0) {
      return;
    }

    try {
      const payloadToSend = sendMode === "text" ? payload + resolveLineEnding(lineEnding) : payload;
      if (isVirtualConnection(activeConnectionId)) {
        const data =
          sendMode === "hex"
            ? [...parseHexInput(payloadToSend)]
            : [...new TextEncoder().encode(payloadToSend)];
        transmitVirtualData(get, set, activeConnectionId, payload, data);
        return;
      }

      const result =
        sendMode === "hex"
          ? await sendSerialHex(activeConnectionId, payloadToSend)
          : await sendSerialText(activeConnectionId, payloadToSend);
      set((state) => ({
        connections: state.connections.map((connection) =>
          connection.id === activeConnectionId
            ? { ...connection, txBytes: connection.txBytes + result.bytesWritten }
            : connection,
        ),
        sendHistory: [payload, ...state.sendHistory.filter((item) => item !== payload)].slice(
          0,
          20,
        ),
        terminalLines: appendLine(state.terminalLines, {
          id: crypto.randomUUID(),
          connectionId: activeConnectionId,
          direction: "tx",
          content: payload + " (" + result.bytesWritten + " B)",
          timestamp: new Date().toISOString(),
          byteLength: result.bytesWritten,
        }),
      }));
    } catch (error) {
      set({ error: getSerialErrorMessage(error) });
    }
  },
  appendRx: (event) =>
    set((state) => ({
      terminalLines: state.terminalPaused
        ? state.terminalLines
        : appendLine(state.terminalLines, {
            id: crypto.randomUUID(),
            connectionId: event.connectionId,
            direction: "rx",
            content: renderSerialData(event, state.displayMode),
            timestamp: event.receivedAt,
            byteLength: event.data.length,
          }),
      hiddenLineCount: state.terminalPaused ? state.hiddenLineCount + 1 : state.hiddenLineCount,
      connections: state.connections.map((connection) =>
        connection.id === event.connectionId
          ? { ...connection, rxBytes: connection.rxBytes + event.data.length }
          : connection,
      ),
    })),
  applyStatus: (event) =>
    set((state) => ({
      connections: state.connections.map((connection) =>
        connection.id === event.connectionId ? { ...connection, state: event.state } : connection,
      ),
      terminalLines: appendLine(state.terminalLines, {
        id: crypto.randomUUID(),
        connectionId: event.connectionId,
        direction: "system",
        content: event.message,
        timestamp: new Date().toISOString(),
      }),
    })),
  setActiveConnection: (activeConnectionId) => set({ activeConnectionId, error: null }),
  setSerialConfig: (config) =>
    set((state) => ({
      serialConfig: {
        ...state.serialConfig,
        ...config,
      },
    })),
  setVirtualLinkConfig: (config) =>
    set((state) => ({
      virtualLinkConfig: {
        ...state.virtualLinkConfig,
        ...config,
      },
    })),
  setSendMode: (sendMode) => set({ sendMode }),
  setDisplayMode: (displayMode) => set({ displayMode }),
  setDirectionFilter: (directionFilter) => set({ directionFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTerminalPaused: (terminalPaused) =>
    set((state) => {
      if (terminalPaused || state.hiddenLineCount === 0) {
        return { terminalPaused };
      }

      return {
        terminalPaused,
        hiddenLineCount: 0,
        terminalLines: appendLine(state.terminalLines, {
          id: crypto.randomUUID(),
          connectionId: state.activeConnectionId ?? "system",
          direction: "system",
          content: "已继续显示，暂停期间隐藏 " + state.hiddenLineCount + " 行。",
          timestamp: new Date().toISOString(),
        }),
      };
    }),
  setAutoScroll: (autoScroll) => set({ autoScroll }),
  setShowTimestamps: (showTimestamps) => set({ showTimestamps }),
  setLineEnding: (lineEnding) => set({ lineEnding }),
  clearTerminal: () => set({ terminalLines: [], hiddenLineCount: 0 }),
}));

function appendLine(lines: TerminalLine[], line: TerminalLine): TerminalLine[] {
  return [...lines, line].slice(-maxTerminalLines);
}

function resolveLineEnding(lineEnding: LineEnding): string {
  switch (lineEnding) {
    case "cr":
      return "\r";
    case "lf":
      return "\n";
    case "crlf":
      return "\r\n";
    case "none":
      return "";
  }
}

function markOpenPorts(
  ports: SerialPortSummary[],
  connections: ConnectionSnapshot[],
): SerialPortSummary[] {
  const openPortNames = new Set(
    connections
      .filter((connection) => connection.state === "open")
      .map((connection) => connection.portName),
  );

  return ports.map((port) => ({
    ...port,
    isOpen: openPortNames.has(port.portName),
  }));
}

function createVirtualConnection(
  id: "virtual_a" | "virtual_b",
  displayName: string,
): ConnectionSnapshot {
  return {
    id,
    portName: displayName,
    displayName,
    state: "open",
    rxBytes: 0,
    txBytes: 0,
  };
}

function isVirtualConnection(connectionId: string): boolean {
  return connectionId === "virtual_a" || connectionId === "virtual_b";
}

function getVirtualPeer(connectionId: string): string | null {
  if (connectionId === "virtual_a") {
    return "virtual_b";
  }

  if (connectionId === "virtual_b") {
    return "virtual_a";
  }

  return null;
}

function transmitVirtualData(
  get: () => SerialState,
  set: Parameters<StateCreator<SerialState>>[0],
  sourceConnectionId: string,
  payload: string,
  data: number[],
) {
  const peerConnectionId = getVirtualPeer(sourceConnectionId);
  if (!peerConnectionId) {
    return;
  }

  const sentAt = new Date().toISOString();
  const sourceLine: TerminalLine = {
    id: crypto.randomUUID(),
    connectionId: sourceConnectionId,
    direction: "tx",
    content: payload + " (" + data.length + " B)",
    timestamp: sentAt,
    byteLength: data.length,
  };

  set((state) => ({
    connections: state.connections.map((connection) =>
      connection.id === sourceConnectionId
        ? { ...connection, txBytes: connection.txBytes + data.length }
        : connection,
    ),
    sendHistory: [payload, ...state.sendHistory.filter((item) => item !== payload)].slice(0, 20),
    terminalLines: appendLine(state.terminalLines, sourceLine),
  }));

  const { virtualLinkConfig } = get();
  if (
    virtualLinkConfig.packetLossRate > 0 &&
    Math.random() * 100 < virtualLinkConfig.packetLossRate
  ) {
    set((state) => ({
      terminalLines: appendLine(state.terminalLines, {
        id: crypto.randomUUID(),
        connectionId: sourceConnectionId,
        direction: "system",
        content: "虚拟链路按丢包率丢弃 1 帧",
        timestamp: new Date().toISOString(),
      }),
    }));
    return;
  }

  const deliveredData = maybeCorruptVirtualData(data, virtualLinkConfig.corruptRate);
  const deliver = () => {
    const event: SerialDataEvent = {
      connectionId: peerConnectionId,
      portName: peerConnectionId === "virtual_a" ? "Virtual Port A" : "Virtual Port B",
      data: deliveredData,
      hex: deliveredData.map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" "),
      receivedAt: new Date().toISOString(),
    };
    get().appendRx(event);
  };

  if (virtualLinkConfig.fixedDelayMs > 0) {
    window.setTimeout(deliver, virtualLinkConfig.fixedDelayMs);
  } else {
    deliver();
  }
}

function maybeCorruptVirtualData(data: number[], corruptRate: number): number[] {
  if (data.length === 0 || corruptRate <= 0 || Math.random() * 100 >= corruptRate) {
    return data;
  }

  const corrupted = [...data];
  corrupted[0] = corrupted[0] ^ 0xff;
  return corrupted;
}
