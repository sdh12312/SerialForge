import { Download, LineChart } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { useSerialStore } from "../../stores/serialStore";
import {
  exportCurveSamples,
  extractCurveSamples,
  summarizeCurveSamples,
  type CurveDirection,
  type CurveSample,
} from "./curveSamples";

const sampleLimits = [40, 80, 120, 200];

export function RealtimeChartPanel() {
  const { terminalLines, connections, activeConnectionId } = useSerialStore();
  const [direction, setDirection] = useState<CurveDirection>("rx");
  const [connectionId, setConnectionId] = useState("active");
  const [limit, setLimit] = useState(80);

  const resolvedConnectionId = connectionId === "active" ? activeConnectionId : connectionId;
  const samples = useMemo(
    () =>
      extractCurveSamples(terminalLines, {
        direction,
        connectionId: resolvedConnectionId ?? undefined,
        limit,
      }),
    [direction, limit, resolvedConnectionId, terminalLines],
  );
  const summary = useMemo(() => summarizeCurveSamples(samples), [samples]);
  const pathPoints = useMemo(() => buildPolylinePoints(samples), [samples]);

  function handleExport() {
    const blob = new Blob([exportCurveSamples(samples)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "serialforge-curve-" + new Date().toISOString().replaceAll(":", "-") + ".csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="module-resizable flex min-h-[160px] flex-col rounded-xl border border-border bg-background/70">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2">
        <div>
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            <LineChart className="h-4 w-4 text-primary" />
            实时曲线
          </span>
          <Badge className="ml-2" tone="success">
            阶段 7
          </Badge>
          <span className="ml-2 text-xs text-muted-foreground">
            从终端 RX/TX 文本中自动提取第一个数值
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-8 rounded-lg border border-border bg-panel px-2 text-xs outline-none"
            value={connectionId}
            onChange={(event) => setConnectionId(event.target.value)}
          >
            <option value="active">当前连接</option>
            <option value="">全部连接</option>
            {connections.map((connection) => (
              <option key={connection.id} value={connection.id}>
                {connection.displayName}
              </option>
            ))}
          </select>
          <select
            className="h-8 rounded-lg border border-border bg-panel px-2 text-xs outline-none"
            value={direction}
            onChange={(event) => setDirection(event.target.value as CurveDirection)}
          >
            <option value="rx">RX</option>
            <option value="tx">TX</option>
            <option value="all">RX + TX</option>
          </select>
          <select
            className="h-8 rounded-lg border border-border bg-panel px-2 text-xs outline-none"
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
          >
            {sampleLimits.map((item) => (
              <option key={item} value={item}>
                最近 {item} 点
              </option>
            ))}
          </select>
          <Button size="sm" variant="ghost" disabled={samples.length === 0} onClick={handleExport}>
            <Download className="h-4 w-4" />
            导出曲线
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_190px] gap-3 p-3">
        <div className="relative min-h-[110px] overflow-hidden rounded-lg border border-border bg-panel">
          {samples.length < 2 ? (
            <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
              暂无足够数值点。设备发送类似 “24.5” 或 “temp=24.5” 的内容后会自动绘制曲线。
            </div>
          ) : (
            <svg className="h-full w-full" viewBox="0 0 640 140" preserveAspectRatio="none">
              <line x1="0" y1="35" x2="640" y2="35" className="stroke-border" />
              <line x1="0" y1="70" x2="640" y2="70" className="stroke-border" />
              <line x1="0" y1="105" x2="640" y2="105" className="stroke-border" />
              <polyline
                points={pathPoints}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
              />
              {samples.slice(-12).map((sample, index, tail) => {
                const point = parsePoint(pathPoints, samples.length - tail.length + index);
                if (!point) {
                  return null;
                }

                return (
                  <circle
                    key={sample.id}
                    cx={point.x}
                    cy={point.y}
                    r="2.5"
                    fill={sample.direction === "rx" ? "hsl(var(--success))" : "hsl(var(--primary))"}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <StatCard label="采样点" value={samples.length} />
          <StatCard label="最新值" value={formatNumber(summary.latest)} />
          <StatCard label="最小值" value={formatNumber(summary.min)} />
          <StatCard label="最大值" value={formatNumber(summary.max)} />
          <StatCard label="平均值" value={formatNumber(summary.average)} />
          <StatCard label="来源" value={direction === "all" ? "RX/TX" : direction.toUpperCase()} />
        </div>
      </div>
    </section>
  );
}

function buildPolylinePoints(samples: CurveSample[]): string {
  if (samples.length === 0) {
    return "";
  }

  const width = 640;
  const height = 140;
  const padding = 12;
  const values = samples.map((sample) => sample.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const xStep = samples.length > 1 ? (width - padding * 2) / (samples.length - 1) : 0;

  return samples
    .map((sample, index) => {
      const x = padding + index * xStep;
      const normalized = (sample.value - min) / range;
      const y = height - padding - normalized * (height - padding * 2);
      return `${roundSvgNumber(x)},${roundSvgNumber(y)}`;
    })
    .join(" ");
}

function parsePoint(points: string, index: number): { x: number; y: number } | null {
  const point = points.split(" ")[index];
  if (!point) {
    return null;
  }

  const [x, y] = point.split(",").map(Number);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

function roundSvgNumber(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatNumber(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/u, "");
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-panel px-3 py-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}
