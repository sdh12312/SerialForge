export type ConnectionKind = "physical" | "virtual-endpoint" | "virtual-device";

export type ConnectionStatus = "closed" | "opening" | "open" | "error" | "disconnected";

export type ConnectionSummary = {
  id: string;
  name: string;
  kind: ConnectionKind;
  status: ConnectionStatus;
  rxBytes: number;
  txBytes: number;
};
