import type { TerminalLine } from "../../stores/serialStore";

export type CurveDirection = "all" | "rx" | "tx";

export type CurveSample = {
  id: string;
  timestamp: string;
  connectionId: string;
  direction: "rx" | "tx";
  value: number;
  source: string;
};

export type CurveSampleOptions = {
  direction?: CurveDirection;
  connectionId?: string;
  limit?: number;
};

const numberPattern = /[-+]?(?:\d+\.\d+|\d+\.?|\.\d+)(?:e[-+]?\d+)?/iu;

export function extractCurveSamples(
  lines: TerminalLine[],
  options: CurveSampleOptions = {},
): CurveSample[] {
  const direction = options.direction ?? "rx";
  const limit = options.limit ?? 120;

  const samples = lines.flatMap((line): CurveSample[] => {
    if (line.direction === "system") {
      return [];
    }

    if (direction !== "all" && line.direction !== direction) {
      return [];
    }

    if (options.connectionId && line.connectionId !== options.connectionId) {
      return [];
    }

    const value = extractFirstNumber(line.content);
    if (value === null) {
      return [];
    }

    return [
      {
        id: line.id,
        timestamp: line.timestamp,
        connectionId: line.connectionId,
        direction: line.direction,
        value,
        source: line.content,
      },
    ];
  });

  return samples.slice(-limit);
}

export function summarizeCurveSamples(samples: CurveSample[]) {
  if (samples.length === 0) {
    return {
      min: null,
      max: null,
      average: null,
      latest: null,
    };
  }

  const values = samples.map((sample) => sample.value);
  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    average: total / values.length,
    latest: values.at(-1) ?? null,
  };
}

export function exportCurveSamples(samples: CurveSample[]): string {
  return [
    ["timestamp", "connectionId", "direction", "value", "source"].join(","),
    ...samples.map((sample) =>
      [
        csvEscape(new Date(sample.timestamp).toISOString()),
        csvEscape(sample.connectionId),
        csvEscape(sample.direction.toUpperCase()),
        String(sample.value),
        csvEscape(sample.source),
      ].join(","),
    ),
  ].join("\n");
}

function extractFirstNumber(content: string): number | null {
  const match = content.match(numberPattern);
  if (!match) {
    return null;
  }

  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

function csvEscape(value: string): string {
  if (!/[",\n\r]/u.test(value)) {
    return value;
  }

  return '"' + value.replaceAll('"', '""') + '"';
}
