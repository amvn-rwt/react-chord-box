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
  // Calculate stroke widths for each string based on their gauge
  const stringStrokes = Array.from({ length: STRINGS }, (_, j) =>
    stringGaugeStroke(j, minDim),
  );

  // Maximum string thickness, used as inset from SVG edge
  const edgeInset = Math.max(...stringStrokes) / 2;

  // Thickness of each fret wire (horizontal line)
  const fretWireStroke = Math.max(1, minDim * 0.004);
  // Inset caused by half the fret thickness (for accurate fret start/end)
  const fretInset = fretWireStroke / 2;

  // Thickness of the nut (the topmost, thick horizontal bar)
  const nutThickness = Math.max(minDim * 0.02, 2.5);
  // Vertical start of the nut
  const nutTop = edgeInset;
  // Vertical bottom of the nut
  const nutBottom = nutTop + nutThickness;

  // Bottom coordinate of the fretboard (excluding edge inset)
  const boardBottom = height - edgeInset;
  // Usable height of the fingerboard (below the nut)
  const innerBoard = Math.max(boardBottom - nutBottom, 1);
  // Height per fret cell
  const cellHeight = innerBoard / VISIBLE_FRETS;

  // Horizontal x-coordinates for the outermost strings
  const xLeft = stringX(0, width, minDim);
  const xRight = stringX(STRINGS - 1, width, minDim);
  // Fret lines run from xLeft to xRight
  const fretX1 = xLeft;
  const fretX2 = xRight;

  // Radius of finger/fret marker dots
  const dotR = Math.max(6, minDim * 0.034);
  // Font size for fretboard position markers ("3", "5", etc)
  const markerFont = Math.max(9, minDim * 0.09);
  // Font size for finger number indicators ("1", "2", etc)
  const fingerFont = Math.max(5, minDim * 0.065);

  // Extra viewBox padding so open/muted glyphs (O, ×) are not clipped at the edges
  const viewPadX = Math.max(markerFont * 0.6, minDim * 0.07, 11);
  const viewPadY = Math.max(markerFont * 0.55, minDim * 0.04, 9);
  const viewBox = `-${viewPadX} -${viewPadY} ${width + 2 * viewPadX} ${height + viewPadY}`;

  // Y position for open or muted string markers (O / × above the nut)
  const openMutedY = Math.max(markerFont * 0.45, nutTop * 0.48);

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      overflow="visible"
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
                X
              </text>
            );
          }

          if (fret < 1 || fret > VISIBLE_FRETS) {
            return null;
          }

          const cy = fretCenterY(fret, nutBottom, cellHeight);

          return (
            <g key={key}>
              <circle cx={x} cy={cy} r={dotR} />
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
