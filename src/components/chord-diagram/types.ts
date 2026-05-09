import { chords } from "./chords";

export interface ChordData {
  frets: number[];
  fingers: number[];
}

export type ChordName = keyof typeof chords;

export interface ChordDiagramProps {
  chord: ChordName;
  width?: number;
  height?: number;
}
