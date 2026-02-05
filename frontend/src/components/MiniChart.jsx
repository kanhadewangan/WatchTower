const MiniChart = ({ data = [], color = "#22C55E", type = "line" }) => {
  const width = 140;
  const height = 48;
  const padding = 6;

  if (!data.length) {
    return (
      <svg width={width} height={height} className="w-full">
        <rect x="0" y="0" width={width} height={height} fill="transparent" />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y, value };
  });

  if (type === "bar") {
    const barWidth = (width - padding * 2) / data.length - 4;
    return (
      <svg width={width} height={height} className="w-full">
        {points.map((point, index) => {
          const barHeight = height - padding - point.y;
          return (
            <rect
              key={index}
              x={padding + index * (barWidth + 4)}
              y={point.y}
              width={barWidth}
              height={barHeight}
              rx="3"
              fill={color}
              opacity="0.8"
            />
          );
        })}
      </svg>
    );
  }

  const pathPoints = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <svg width={width} height={height} className="w-full">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polyline
        points={pathPoints}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`${points[0].x},${height - padding} ${pathPoints} ${points[points.length - 1].x},${height - padding}`}
        fill={`url(#gradient-${color})`}
      />
    </svg>
  );
};

export default MiniChart;
