export default function Logo() {
  const dots = [
    [-160, 0], [-128, 0], [-96, 0], [-64, 0], [-32, 0],
    [0, 0], [32, 0], [64, 0], [96, 0], [128, 0], [160, 0],
    [0, -32], [24, -64], [48, -96],
    [32, 32], [64, 64], [96, 96],
  ];

  return (
    <svg
      width="70"
      height="40"
      viewBox="-180 -110 360 220"
      xmlns="http://www.w3.org/2000/svg"
    >
      {dots.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="10"
          fill="#38bdf8"
          opacity="0.95"
        />
      ))}
    </svg>
  );
}