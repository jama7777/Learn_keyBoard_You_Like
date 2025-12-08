import { FingerName, KeyConfig, LessonMode } from './types';

// Finger Color Map for visual guidance
export const FINGER_COLORS: Record<FingerName, string> = {
  'L_PINKY': '#ef4444', // Red 500
  'L_RING': '#f97316', // Orange 500
  'L_MIDDLE': '#eab308', // Yellow 500
  'L_INDEX': '#22c55e', // Green 500
  'L_THUMB': '#3b82f6', // Blue 500
  'R_THUMB': '#3b82f6', // Blue 500
  'R_INDEX': '#22c55e', // Green 500
  'R_MIDDLE': '#eab308', // Yellow 500
  'R_RING': '#f97316', // Orange 500
  'R_PINKY': '#ef4444', // Red 500
};

// Keyboard Layout Configuration
export const KEYBOARD_ROWS: KeyConfig[][] = [
  // Row 1 (Numbers)
  [
    { label: '`', code: 'Backquote', finger: 'L_PINKY' },
    { label: '1', code: 'Digit1', finger: 'L_PINKY' },
    { label: '2', code: 'Digit2', finger: 'L_RING' },
    { label: '3', code: 'Digit3', finger: 'L_MIDDLE' },
    { label: '4', code: 'Digit4', finger: 'L_INDEX' },
    { label: '5', code: 'Digit5', finger: 'L_INDEX' },
    { label: '6', code: 'Digit6', finger: 'R_INDEX' },
    { label: '7', code: 'Digit7', finger: 'R_INDEX' },
    { label: '8', code: 'Digit8', finger: 'R_MIDDLE' },
    { label: '9', code: 'Digit9', finger: 'R_RING' },
    { label: '0', code: 'Digit0', finger: 'R_PINKY' },
    { label: '-', code: 'Minus', finger: 'R_PINKY' },
    { label: '=', code: 'Equal', finger: 'R_PINKY' },
    { label: 'Backspace', code: 'Backspace', finger: 'R_PINKY', width: 2.0 },
  ],
  // Row 2 (Top)
  [
    { label: 'Tab', code: 'Tab', finger: 'L_PINKY', width: 1.5 },
    { label: 'Q', code: 'KeyQ', finger: 'L_PINKY' },
    { label: 'W', code: 'KeyW', finger: 'L_RING' },
    { label: 'E', code: 'KeyE', finger: 'L_MIDDLE' },
    { label: 'R', code: 'KeyR', finger: 'L_INDEX' },
    { label: 'T', code: 'KeyT', finger: 'L_INDEX' },
    { label: 'Y', code: 'KeyY', finger: 'R_INDEX' },
    { label: 'U', code: 'KeyU', finger: 'R_INDEX' },
    { label: 'I', code: 'KeyI', finger: 'R_MIDDLE' },
    { label: 'O', code: 'KeyO', finger: 'R_RING' },
    { label: 'P', code: 'KeyP', finger: 'R_PINKY' },
    { label: '[', code: 'BracketLeft', finger: 'R_PINKY' },
    { label: ']', code: 'BracketRight', finger: 'R_PINKY' },
    { label: '\\', code: 'Backslash', finger: 'R_PINKY', width: 1.5 },
  ],
  // Row 3 (Home)
  [
    { label: 'Caps', code: 'CapsLock', finger: 'L_PINKY', width: 1.75 },
    { label: 'A', code: 'KeyA', finger: 'L_PINKY' },
    { label: 'S', code: 'KeyS', finger: 'L_RING' },
    { label: 'D', code: 'KeyD', finger: 'L_MIDDLE' },
    { label: 'F', code: 'KeyF', finger: 'L_INDEX' },
    { label: 'G', code: 'KeyG', finger: 'L_INDEX' },
    { label: 'H', code: 'KeyH', finger: 'R_INDEX' },
    { label: 'J', code: 'KeyJ', finger: 'R_INDEX' },
    { label: 'K', code: 'KeyK', finger: 'R_MIDDLE' },
    { label: 'L', code: 'KeyL', finger: 'R_RING' },
    { label: ';', code: 'Semicolon', finger: 'R_PINKY' },
    { label: "'", code: 'Quote', finger: 'R_PINKY' },
    { label: 'Enter', code: 'Enter', finger: 'R_PINKY', width: 2.25 },
  ],
  // Row 4 (Bottom)
  [
    { label: 'Shift', code: 'ShiftLeft', finger: 'L_PINKY', width: 2.25 },
    { label: 'Z', code: 'KeyZ', finger: 'L_PINKY' },
    { label: 'X', code: 'KeyX', finger: 'L_RING' },
    { label: 'C', code: 'KeyC', finger: 'L_MIDDLE' },
    { label: 'V', code: 'KeyV', finger: 'L_INDEX' },
    { label: 'B', code: 'KeyB', finger: 'L_INDEX' },
    { label: 'N', code: 'KeyN', finger: 'R_INDEX' },
    { label: 'M', code: 'KeyM', finger: 'R_INDEX' },
    { label: ',', code: 'Comma', finger: 'R_MIDDLE' },
    { label: '.', code: 'Period', finger: 'R_RING' },
    { label: '/', code: 'Slash', finger: 'R_PINKY' },
    { label: 'Shift', code: 'ShiftRight', finger: 'R_PINKY', width: 2.75 },
  ],
  // Row 5 (Space)
  [
    { label: 'Space', code: 'Space', finger: 'L_THUMB', width: 10 }, 
  ]
];

// Map character to finger/code for quick lookup
export const CHAR_TO_KEY_MAP: Record<string, { code: string, finger: FingerName, shift?: boolean }> = {};

KEYBOARD_ROWS.forEach(row => {
  row.forEach(key => {
    // Basic mapping
    const mainChar = key.label.toLowerCase();
    CHAR_TO_KEY_MAP[mainChar] = { code: key.code, finger: key.finger };
    
    // Uppercase mapping
    if (mainChar !== key.label) {
         CHAR_TO_KEY_MAP[key.label] = { code: key.code, finger: key.finger, shift: false };
    } else if (mainChar.match(/[a-z]/)) {
         CHAR_TO_KEY_MAP[mainChar.toUpperCase()] = { code: key.code, finger: key.finger, shift: true };
    }
    
    // Special Symbol mappings (Hardcoded for US Layout commonality)
    if (key.label === '1') CHAR_TO_KEY_MAP['!'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === '2') CHAR_TO_KEY_MAP['@'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === '3') CHAR_TO_KEY_MAP['#'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === '4') CHAR_TO_KEY_MAP['$'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === '5') CHAR_TO_KEY_MAP['%'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === '6') CHAR_TO_KEY_MAP['^'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === '7') CHAR_TO_KEY_MAP['&'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === '8') CHAR_TO_KEY_MAP['*'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === '9') CHAR_TO_KEY_MAP['('] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === '0') CHAR_TO_KEY_MAP[')'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === '-') CHAR_TO_KEY_MAP['_'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === '=') CHAR_TO_KEY_MAP['+'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === '[') CHAR_TO_KEY_MAP['{'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === ']') CHAR_TO_KEY_MAP['}'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === '\\') CHAR_TO_KEY_MAP['|'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === ';') CHAR_TO_KEY_MAP[':'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === "'") CHAR_TO_KEY_MAP['"'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === ',') CHAR_TO_KEY_MAP['<'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === '.') CHAR_TO_KEY_MAP['>'] = { code: key.code, finger: key.finger, shift: true };
    if (key.label === '/') CHAR_TO_KEY_MAP['?'] = { code: key.code, finger: key.finger, shift: true };
  });
});
// Manually add space and newline
CHAR_TO_KEY_MAP[' '] = { code: 'Space', finger: 'L_THUMB' };
CHAR_TO_KEY_MAP['\n'] = { code: 'Enter', finger: 'R_PINKY' };

export const PRESET_LESSONS = [
  { 
    id: '1', 
    title: 'Home Row (a-k)', 
    description: 'Master the home row: a, s, d, f, g, h, j, k, l, ;', 
    mode: LessonMode.HOME_ROW
  },
  { 
    id: '2', 
    title: 'Numbers & Letters', 
    description: 'Mixed practice: alphabets and numbers.', 
    mode: LessonMode.ALPHANUMERIC
  },
  { 
    id: '3', 
    title: 'Top Row', 
    description: 'Q, W, E, R, T, Y, U, I, O, P', 
    mode: LessonMode.TOP_ROW
  },
  { 
    id: '4', 
    title: 'Bottom Row', 
    description: 'Z, X, C, V, B, N, M', 
    mode: LessonMode.BOTTOM_ROW
  },
  { 
    id: '5', 
    title: 'Numbers & Symbols', 
    description: 'Advanced: !, @, #, $, %, etc.', 
    mode: LessonMode.SYMBOLS
  },
  { 
    id: '6', 
    title: 'Full Practice', 
    description: 'Real world sentences with everything.', 
    mode: LessonMode.ALL
  },
];