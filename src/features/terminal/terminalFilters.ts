import type { DirectionFilter, TerminalLine } from "../../stores/serialStore";

export type TerminalExportFormat = "log" | "csv";

export type TerminalStats = {
  total: number;
  rx: number;
  tx: number;
  system: number;
  hidden: number;
  rxBytes: number;
  txBytes: number;
  connectionCount: number;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
  durationMs: number;
};

export function filterTerminalLines(
  lines: TerminalLine[],
  query: string,
  directionFilter: DirectionFilter,
): TerminalLine[] {
  const normalizedQuery = query.trim().toLowerCase();

  return lines.filter((line) => {
    const matchesDirection = directionFilter === "all" || line.direction === directionFilter;
    const searchableText = [
      line.content,
      line.direction,
      line.connectionId,
      new Date(line.timestamp).toISOString(),
    ]
      .join(" ")
      .toLowerCase();
    const matchesQuery = normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

    return matchesDirection && matchesQuery;
  });
}

export function exportTerminalLines(
  lines: TerminalLine[],
  format: TerminalExportFormat = "log",
): string {
  if (format === "csv") {
    return [
      ["timestamp", "direction", "connectionId", "byteLength", "content"].join(","),
      ...lines.map((line) =>
        [
          csvEscape(new Date(line.timestamp).toISOString()),
          csvEscape(line.direction.toUpperCase()),
          csvEscape(line.connectionId),
          csvEscape(String(line.byteLength ?? "")),
          csvEscape(line.content),
        ].join(","),
      ),
    ].join("\n");
  }

  return lines
    .map((line) => {
      const timestamp = new Date(line.timestamp).toISOString();
      const byteSuffix = line.byteLength === undefined ? "" : " (" + line.byteLength + " B)";
      return (
        "[" + timestamp + "] " + line.direction.toUpperCase() + byteSuffix + " " + line.content
      );
    })
    .join("\n");
}

export function summarizeTerminalLines(lines: TerminalLine[], hiddenLineCount = 0): TerminalStats {
  const connections = new Set<string>();
  let rx = 0;
  let tx = 0;
  let system = 0;
  let rxBytes = 0;
  let txBytes = 0;
  let firstTimestamp: string | null = null;
  let lastTimestamp: string | null = null;

  for (const line of lines) {
    connections.add(line.connectionId);

    if (line.direction === "rx") {
      rx += 1;
      rxBytes += line.byteLength ?? 0;
    } else if (line.direction === "tx") {
      tx += 1;
      txBytes += line.byteLength ?? 0;
    } else {
      system += 1;
    }

    if (!firstTimestamp || line.timestamp < firstTimestamp) {
      firstTimestamp = line.timestamp;
    }

    if (!lastTimestamp || line.timestamp > lastTimestamp) {
      lastTimestamp = line.timestamp;
    }
  }

  const durationMs =
    firstTimestamp && lastTimestamp
      ? Math.max(0, new Date(lastTimestamp).getTime() - new Date(firstTimestamp).getTime())
      : 0;

  return {
    total: lines.length,
    rx,
    tx,
    system,
    hidden: hiddenLineCount,
    rxBytes,
    txBytes,
    connectionCount: connections.size,
    firstTimestamp,
    lastTimestamp,
    durationMs,
  };
}

function csvEscape(value: string): string {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return '"' + value.replaceAll('"', '""') + '"';
}
