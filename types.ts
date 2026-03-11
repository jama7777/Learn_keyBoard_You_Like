export type FingerName = 'L_PINKY' | 'L_RING' | 'L_MIDDLE' | 'L_INDEX' | 'L_THUMB' | 'R_THUMB' | 'R_INDEX' | 'R_MIDDLE' | 'R_RING' | 'R_PINKY';

export interface KeyConfig {
  label: string;
  code: string; // event.code (e.g., KeyA, Space)
  finger: FingerName;
  width?: number; // Relative width (1 is standard key)
}

export enum LessonMode {
  HOME_ROW = 'HOME_ROW',
  TOP_ROW = 'TOP_ROW',
  BOTTOM_ROW = 'BOTTOM_ROW',
  NUMBERS = 'NUMBERS',
  ALPHABETS = 'ALPHABETS',
  ALPHANUMERIC = 'ALPHANUMERIC',
  SYMBOLS = 'SYMBOLS',
  ALL = 'ALL',
  AI_CUSTOM = 'AI_CUSTOM'
}

export interface LessonConfig {
  id: string;
  title: string;
  description: string;
  mode: LessonMode;
  content?: string; // Pre-defined content
}

export interface Stats {
  wpm: number;
  accuracy: number;
  errors: number;
  progress: number;
  timeElapsed: number;
}

export interface Song {
  id: string;
  title: string;
  notes: number[]; // Array of frequencies
}