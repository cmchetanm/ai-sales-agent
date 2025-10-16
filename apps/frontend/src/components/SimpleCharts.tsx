import React from 'react';

export function SimpleBarChart({ data, height = 200 }: { data: Array<{ label: string; value: number }>; height?: number }) {
  const width = 420;
  const max = Math.max(1, ...data.map(d => d.value));
  const barW = Math.max(10, Math.floor(width / (data.length * 1.5)));
  const gap = barW * 0.5;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 30);
        const x = i * (barW + gap) + 24;
        const y = height - 20 - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={h} fill="#6d72f3" rx={2} />
            <text x={x + barW / 2} y={height - 6} fontSize={10} textAnchor="middle" fill="#94a3b8">{d.label.slice(0,4)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function SimpleLineChart({ points, height = 200 }: { points: Array<{ x: string; y: number }>; height?: number }) {
  const width = 420;
  const max = Math.max(1, ...points.map(p => p.y));
  const step = points.length > 1 ? (width - 40) / (points.length - 1) : 0;
  const path = points.map((p, i) => {
    const x = 20 + i * step;
    const y = height - 20 - (p.y / max) * (height - 40);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={path} fill="none" stroke="#22d3ee" strokeWidth={2} />
    </svg>
  );
}

export function SimplePieChart({ data, height = 220 }: { data: Array<{ label: string; value: number }>; height?: number }) {
  const width = height;
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(cx, cy) - 8;
  const total = data.reduce((s, d) => s + (d.value || 0), 0) || 1;
  let angle = -Math.PI / 2;
  const colors = ['#6d72f3', '#22d3ee', '#f472b6', '#10b981', '#f59e0b', '#ef4444'];
  const arcs = data.map((d, i) => {
    const frac = (d.value || 0) / total;
    const a2 = angle + frac * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const large = frac > 0.5 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    const fill = colors[i % colors.length];
    angle = a2;
    return <path key={i} d={path} fill={fill} opacity={0.9} />;
  });
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>{arcs}</svg>
  );
}

