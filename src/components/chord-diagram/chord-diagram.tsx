import { chords } from "./chords";
import type { ChordDiagramProps } from "./types";

const STRINGS = 6;
/** How many fret spaces to show below the nut (typical chord chart). */
const VISIBLE_FRETS = 4;

/** Low E (i = 0) is thickest; high e (i = STRINGS - 1) is thinnest. */
function stringGaugeStroke(i: number, minDim: number): number {
  const thin = Math.max(0.65, minDim * 0.0038);
  const thick = Math.max(1.4, minDim * 0.011);
  if (STRINGS <= 1) return (thin + thick) / 2;
  return thick + (thin - thick) * (i / (STRINGS - 1));
}

function stringX(i: number, width: number, minDim: number): number {
  if (STRINGS <= 1) return width / 2;
  const s0 = stringGaugeStroke(0, minDim);
  const sLast = stringGaugeStroke(STRINGS - 1, minDim);
  const left = s0 / 2;
  const right = width - sLast / 2;
  return left + (i / (STRINGS - 1)) * (right - left);
}

/** 1-based fret number → vertical center of that fret cell. */
function fretCenterY(
  fret: number,
  nutBottom: number,
  cellHeight: number,
): number {
  return nutBottom + (fret - 0.5) * cellHeight;
}

export default function ChordDiagram({
  chord,
  width = 150,
  height = 200,
}: ChordDiagramProps) {
  const { frets, fingers } = chords[chord];
  const minDim = Math.min(width, height);
  const stringStrokes = Array.from({ length: STRINGS }, (_, j) =>
    stringGaugeStroke(j, minDim),
  );
  const edgeInset = Math.max(...stringStrokes) / 2;

  const fretWireStroke = Math.max(1, minDim * 0.004);
  const fretInset = fretWireStroke / 2;

  const nutThickness = Math.max(minDim * 0.02, 2.5);
  const nutTop = edgeInset;
  const nutBottom = nutTop + nutThickness;

  const boardBottom = height - edgeInset;
  const innerBoard = Math.max(boardBottom - nutBottom, 1);
  const cellHeight = innerBoard / VISIBLE_FRETS;

  const xLeft = stringX(0, width, minDim);
  const xRight = stringX(STRINGS - 1, width, minDim);
  const fretX1 = xLeft;
  const fretX2 = xRight;

  const dotR = Math.max(6, minDim * 0.034);
  const markerFont = Math.max(10, minDim * 0.09);
  const fingerFont = Math.max(9, minDim * 0.065);
  const openMutedY = Math.max(dotR, (nutTop + edgeInset) * 0.45);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-label={`${chord} chord diagram`}
    >
      {/* frets (drawn under strings) */}
      <g strokeLinecap="butt">
        {Array.from({ length: VISIBLE_FRETS }, (_, k) => {
          const y = nutBottom + (k + 1) * cellHeight;
          return (
            <line
              key={`fret-${k}`}
              x1={fretX1}
              x2={fretX2}
              y1={y}
              y2={y}
              stroke="#9ca3af"
              strokeWidth={fretWireStroke}
            />
          );
        })}
      </g>

      {/* nut */}
      <rect
        x={fretX1 - fretInset}
        y={nutTop}
        width={fretX2 - fretX1 + 2 * fretInset}
        height={nutThickness}
        fill="#1f2937"
      />

      {/* strings */}
      {Array.from({ length: STRINGS }).map((_, i) => {
        const x = stringX(i, width, minDim);
        const sw = stringStrokes[i]!;
        return (
          <line
            key={i}
            stroke="#6b7280"
            strokeWidth={sw}
            x1={x}
            y1={edgeInset}
            x2={x}
            y2={height - edgeInset + 0.5} // +0.5 to avoid clipping
          />
        );
      })}

      {/* finger dots, open (O), muted (×) */}
      <g>
        {frets.map((fret, i) => {
          const finger = fingers[i]!;
          const x = stringX(i, width, minDim);
          const key = `finger-${i}`;

          if (fret === 0) {
            return (
              <text
                key={key}
                x={x}
                y={openMutedY}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#374151"
                fontSize={markerFont}
                fontWeight={600}
                fontFamily="system-ui, sans-serif"
              >
                O
              </text>
            );
          }

          if (fret === -1) {
            return (
              <text
                key={key}
                x={x}
                y={openMutedY}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#374151"
                fontSize={markerFont}
                fontWeight={500}
                fontFamily="system-ui, sans-serif"
              >
                ×
              </text>
            );
          }

          if (fret < 1 || fret > VISIBLE_FRETS) {
            return null;
          }

          const cy = fretCenterY(fret, nutBottom, cellHeight);

          return (
            <g key={key}>
              <circle
                cx={x}
                cy={cy}
                r={dotR}
                fill="#1d4ed8"
              />
              {finger > 0 && (
                <text
                  x={x}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#ffffff"
                  fontSize={fingerFont}
                  fontWeight={700}
                  fontFamily="system-ui, sans-serif"
                >
                  {finger}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
