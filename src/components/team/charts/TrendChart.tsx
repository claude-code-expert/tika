'use client';

interface TrendPoint {
  date: string;
  created: number;
  resolved: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  height?: number;
}

export function TrendChart({ data, height = 160 }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8993A4',
          fontSize: 13,
        }}
      >
        데이터 없음
      </div>
    );
  }

  const viewW = 600;
  const viewH = height;
  const padL = 40;
  const padR = 20;
  const padT = 14;
  const padB = 30;
  const innerW = viewW - padL - padR;
  const innerH = viewH - padT - padB;
  const axisBottom = padT + innerH;

  const maxVal = Math.max(...data.map((d) => Math.max(d.created, d.resolved)), 1);
  const n = data.length;

  const xScale = (i: number) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yScale = (v: number) => padT + innerH - (v / maxVal) * innerH;

  const createdPoints = data
    .map((d, i) => `${xScale(i).toFixed(1)},${yScale(d.created).toFixed(1)}`)
    .join(' ');
  const resolvedPoints = data
    .map((d, i) => `${xScale(i).toFixed(1)},${yScale(d.resolved).toFixed(1)}`)
    .join(' ');

  const firstX = xScale(0).toFixed(1);
  const lastX = xScale(n - 1).toFixed(1);
  const createdFill = `${createdPoints} ${lastX},${axisBottom} ${firstX},${axisBottom}`;
  const resolvedFill = `${resolvedPoints} ${lastX},${axisBottom} ${firstX},${axisBottom}`;

  const gridValues = [0, Math.round(maxVal / 2), maxVal];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="18" height="4" style={{ display: 'block', overflow: 'visible' }}>
              <line x1="0" x2="18" y1="2" y2="2" stroke="#3B82F6" strokeWidth="2" />
            </svg>
            <span style={{ fontSize: 12, color: '#5A6B7F' }}>생성</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="18" height="4" style={{ display: 'block', overflow: 'visible' }}>
              <line x1="0" x2="18" y1="2" y2="2" stroke="#629584" strokeWidth="2.5" />
            </svg>
            <span style={{ fontSize: 12, color: '#5A6B7F' }}>완료</span>
          </div>
        </div>
      </div>
    <svg
      width="100%"
      viewBox={`0 0 ${viewW} ${viewH}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Axis lines */}
      <line x1={padL} y1={padT} x2={padL} y2={axisBottom} stroke="#DFE1E6" strokeWidth={1} />
      <line x1={padL} y1={axisBottom} x2={padL + innerW} y2={axisBottom} stroke="#DFE1E6" strokeWidth={1} />

      {/* Dashed horizontal grid lines */}
      {gridValues.slice(1).map((v, i) => (
        <line
          key={i}
          x1={padL}
          x2={padL + innerW}
          y1={yScale(v)}
          y2={yScale(v)}
          stroke="#DFE1E6"
          strokeWidth={0.5}
          strokeDasharray="4"
        />
      ))}

      {/* Y-axis labels */}
      {gridValues.map((v, i) => (
        <text key={i} x={padL - 4} y={yScale(v) + 4} textAnchor="end" fontSize={9} fill="#8993A4">
          {v}
        </text>
      ))}

      {/* X-axis date labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={xScale(i)}
          y={axisBottom + 14}
          textAnchor="middle"
          fontSize={9}
          fill="#8993A4"
        >
          {d.date.slice(5).replace('-', '/')}
        </text>
      ))}

      {/* Fill areas */}
      <polygon points={createdFill} fill="#3B82F6" fillOpacity={0.06} />
      <polygon points={resolvedFill} fill="#629584" fillOpacity={0.08} />

      {/* Created line */}
      <polyline
        points={createdPoints}
        stroke="#3B82F6"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Resolved line */}
      <polyline
        points={resolvedPoints}
        stroke="#629584"
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Created dots */}
      {data.map((d, i) => (
        <circle key={`c-${i}`} cx={xScale(i)} cy={yScale(d.created)} r={3} fill="#3B82F6" />
      ))}

      {/* Resolved dots */}
      {data.map((d, i) => {
        const isLast = i === n - 1;
        return (
          <circle
            key={`r-${i}`}
            cx={xScale(i)}
            cy={yScale(d.resolved)}
            r={isLast ? 4 : 3}
            fill="#629584"
            stroke={isLast ? '#fff' : 'none'}
            strokeWidth={isLast ? 2 : 0}
          />
        );
      })}

      {/* Today marker — dashed vertical at last point */}
      <line
        x1={xScale(n - 1)}
        y1={padT}
        x2={xScale(n - 1)}
        y2={axisBottom}
        stroke="#629584"
        strokeWidth={1}
        strokeDasharray="3"
      />

    </svg>
    </div>
  );
}
