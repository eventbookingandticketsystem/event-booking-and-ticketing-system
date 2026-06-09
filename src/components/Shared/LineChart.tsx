import { cn } from "@/lib/utils";

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  className?: string;
  color?: string;
  areaColor?: string;
}

export function LineChart({
  data,
  height = 160,
  className,
  color = "#FF5A00",
  areaColor = "rgba(255,90,0,0.10)",
}: LineChartProps) {
  if (!data.length) return null;

  const W = 600;
  const H = height;
  const PADDING = { top: 12, right: 12, bottom: 28, left: 36 };
  const chartW = W - PADDING.left - PADDING.right;
  const chartH = H - PADDING.top - PADDING.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const step = chartW / Math.max(data.length - 1, 1);

  const pts = data.map((d, i) => ({
    x: PADDING.left + i * step,
    y: PADDING.top + chartH - (d.value / maxVal) * chartH,
    label: d.label,
    value: d.value,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath =
    `M ${pts[0].x} ${PADDING.top + chartH} ` +
    pts.map((p) => `L ${p.x} ${p.y}`).join(" ") +
    ` L ${pts[pts.length - 1].x} ${PADDING.top + chartH} Z`;

  // Y-axis grid lines (4 lines)
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((frac) => ({
    y: PADDING.top + chartH - frac * chartH,
    label: Math.round(frac * maxVal).toString(),
  }));

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        aria-label="Line chart"
        role="img"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={PADDING.left}
              y1={g.y}
              x2={W - PADDING.right}
              y2={g.y}
              stroke="#E2E0D8"
              strokeWidth={1}
              strokeDasharray={i === 0 ? undefined : "4 4"}
            />
            <text
              x={PADDING.left - 6}
              y={g.y + 4}
              textAnchor="end"
              fontSize={11}
              fill="#6B7280"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {g.label}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={areaColor} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} stroke="#fff" strokeWidth={2} />
        ))}

        {/* X-axis labels */}
        {pts.map((p, i) => (
          i % Math.ceil(pts.length / 6) === 0 && (
            <text
              key={i}
              x={p.x}
              y={H - 4}
              textAnchor="middle"
              fontSize={11}
              fill="#6B7280"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {p.label}
            </text>
          )
        ))}
      </svg>
    </div>
  );
}
