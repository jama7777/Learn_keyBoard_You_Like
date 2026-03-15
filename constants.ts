import { FingerName, KeyConfig, LessonMode, Song } from './types';

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
    if (mainChar.match(/^[a-z]$/)) {
         CHAR_TO_KEY_MAP[mainChar.toUpperCase()] = { code: key.code, finger: key.finger, shift: true };
    } else if (mainChar !== key.label) {
         CHAR_TO_KEY_MAP[key.label] = { code: key.code, finger: key.finger, shift: false };
    }
    
    // Special Symbol mappings
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
CHAR_TO_KEY_MAP[' '] = { code: 'Space', finger: 'L_THUMB' };
CHAR_TO_KEY_MAP['\n'] = { code: 'Enter', finger: 'R_PINKY' };

export const PRESET_LESSONS = [
  { 
    id: '1', 
    title: 'Home Row (a-k)', 
    description: 'Master the home row: a, s, d, f, g, h, j, k, l, ;', 
    mode: LessonMode.HOME_ROW,
    defaultSongId: 'twinkle'
  },
  { 
    id: '2', 
    title: 'Numbers & Letters', 
    description: 'Mixed practice: alphabets and numbers.', 
    mode: LessonMode.ALPHANUMERIC,
    defaultSongId: 'tetris'
  },
  { 
    id: '3', 
    title: 'Top Row', 
    description: 'Q, W, E, R, T, Y, U, I, O, P', 
    mode: LessonMode.TOP_ROW,
    defaultSongId: 'mario'
  },
  { 
    id: '4', 
    title: 'Bottom Row', 
    description: 'Z, X, C, V, B, N, M', 
    mode: LessonMode.BOTTOM_ROW,
    defaultSongId: 'ode'
  },
  { 
    id: '5', 
    title: 'Numbers & Symbols', 
    description: 'Advanced: !, @, #, $, %, etc.', 
    mode: LessonMode.SYMBOLS,
    defaultSongId: 'tetris'
  },
  { 
    id: '6', 
    title: 'Full Practice', 
    description: 'Real world sentences with everything.', 
    mode: LessonMode.ALL,
    defaultSongId: 'twinkle'
  },
];

export const NOTE_FREQUENCIES: Record<string, number> = {
  // Octave 3
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  // Octave 4 (Middle C is C4)
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  // Octave 5
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  // Octave 6
  'C6': 1046.50
};

export const PRESET_SONGS: Song[] = [
  { id: 'twinkle', title: 'Twinkle Twinkle Little Star', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4']] },
  { id: 'ode_to_joy', title: 'Ode to Joy', notes: [NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4']] },
  { id: 'fur_elise', title: 'Fur Elise', notes: [NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D#5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D#5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4']] },
  { id: 'happy_birthday', title: 'Happy Birthday', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4']] },
  { id: 'jingle_bells', title: 'Jingle Bells', notes: [NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4']] },
  { id: 'tetris', title: 'Tetris Theme', notes: [NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['D5']] },
  { id: 'mario_theme', title: 'Super Mario Theme', notes: [NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['G5'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4']] },
  { id: 'mary_lamb', title: 'Mary Had a Little Lamb', notes: [NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4']] },
  { id: 'london_bridge', title: 'London Bridge', notes: [NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G4']] },
  { id: 'row_boat', title: 'Row Row Row Your Boat', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4']] },
  { id: 'baa_baa', title: 'Baa Baa Black Sheep', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4']] },
  { id: 'frere_jacques', title: 'Frere Jacques', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G4']] },
  { id: 'old_macdonald', title: 'Old MacDonald', notes: [NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4']] },
  { id: 'hot_cross_buns', title: 'Hot Cross Buns', notes: [NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4']] },
  { id: 'morning_mood', title: 'Morning Mood (Grieg)', notes: [NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['B3'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4']] },
  { id: 'canon_in_d', title: 'Canon in D', notes: [NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C#4'], NOTE_FREQUENCIES['B3'], NOTE_FREQUENCIES['A3'], NOTE_FREQUENCIES['B3'], NOTE_FREQUENCIES['C#4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C#4'], NOTE_FREQUENCIES['B3'], NOTE_FREQUENCIES['A3'], NOTE_FREQUENCIES['G3'], NOTE_FREQUENCIES['F#3'], NOTE_FREQUENCIES['G3'], NOTE_FREQUENCIES['A3']] },
  { id: 'minuet_bach', title: 'Minuet in G (Bach)', notes: [NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['G5'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['F#5'], NOTE_FREQUENCIES['G5']] },
  { id: 'symphony_5', title: 'Symphony No.5 (Beethoven)', notes: [NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['D#4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['D4']] },
  { id: 'moonlight_sonata', title: 'Moonlight Sonata', notes: [NOTE_FREQUENCIES['C#4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['C#5'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['C#4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['C#5'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['E4']] },
  { id: 'spring_vivaldi', title: 'Spring (Vivaldi)', notes: [NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['F#5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D#5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['F#5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['C#5']] },
  { id: 'hall_mountain', title: 'Hall of the Mountain King', notes: [NOTE_FREQUENCIES['A3'], NOTE_FREQUENCIES['B3'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D#4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D#4'], NOTE_FREQUENCIES['E4']] },
  { id: 'turkish_march', title: 'Turkish March (Mozart)', notes: [NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5']] },
  { id: 'entertainer', title: 'The Entertainer (Joplin)', notes: [NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['G4']] },
  { id: 'auld_lang_syne', title: 'Auld Lang Syne', notes: [NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['G5'], NOTE_FREQUENCIES['G5'], NOTE_FREQUENCIES['E5']] },
  { id: 'amazing_grace', title: 'Amazing Grace', notes: [NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['G5']] },
  { id: 'we_wish_xmas', title: 'We Wish You a Merry Christmas', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4']] },
  { id: 'silent_night', title: 'Silent Night', notes: [NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['G4']] },
  { id: 'deck_halls', title: 'Deck the Halls', notes: [NOTE_FREQUENCIES['G5'], NOTE_FREQUENCIES['F5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['F5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5']] },
  { id: 'yankee_doodle', title: 'Yankee Doodle', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['B3']] },
  { id: 'oh_susanna', title: 'Oh Susanna', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4']] },
  { id: 'oh_when_saints', title: 'When Saints Go Marching In', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E4']] },
  { id: 'camptown_races', title: 'Camptown Races', notes: [NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4']] },
  { id: 'big_ben', title: 'Westminster Chime', notes: [NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['B3'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['B3']] },
  { id: 'scarborough_fair', title: 'Scarborough Fair', notes: [NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4']] },
  { id: 'greensleeves', title: 'Greensleeves', notes: [NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['A4']] },
  { id: 'country_road', title: 'Take Me Home Country Roads', notes: [NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4']] },
  { id: 'stand_by_me', title: 'Stand By Me', notes: [NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4']] },
  { id: 'let_it_be', title: 'Let It Be (Beatles)', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4']] },
  { id: 'yesterday', title: 'Yesterday (Beatles)', notes: [NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4']] },
  { id: 'imagine', title: 'Imagine (Lennon)', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4']] },
  { id: 'nokia_tune', title: 'Nokia Ringtone', notes: [NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['C#5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['C#4'], NOTE_FREQUENCIES['E4']] },
  { id: 'axel_f', title: 'Axel F Theme', notes: [NOTE_FREQUENCIES['F5'], NOTE_FREQUENCIES['A#5'], NOTE_FREQUENCIES['F5'], NOTE_FREQUENCIES['F5'], NOTE_FREQUENCIES['C6'], NOTE_FREQUENCIES['F5'], NOTE_FREQUENCIES['D#5'], NOTE_FREQUENCIES['F5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['F5'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['F5'], NOTE_FREQUENCIES['G#5']] },
  { id: 'zelda_theme', title: 'Zelda Main Theme', notes: [NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['A#4']] },
  { id: 'pokemon_theme', title: 'Pokemon Main Theme', notes: [NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['B3'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['A3'], NOTE_FREQUENCIES['A3'], NOTE_FREQUENCIES['A3'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4']] },
  { id: 'final_fantasy', title: 'Final Fantasy Prelude', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['E4']] },
  { id: 'indiana_jones', title: 'Indiana Jones Theme', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4']] },
  { id: 'star_wars', title: 'Star Wars Theme', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['A4']] },
  { id: 'harry_potter', title: 'Harry Potter Theme', notes: [NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['G5'], NOTE_FREQUENCIES['F#5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['B5'], NOTE_FREQUENCIES['A5'], NOTE_FREQUENCIES['F#5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['G5'], NOTE_FREQUENCIES['F#5'], NOTE_FREQUENCIES['D#5'], NOTE_FREQUENCIES['F5'], NOTE_FREQUENCIES['B4']] },
  { id: 'pirates_caribbean', title: 'Pirates of the Caribbean', notes: [NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4']] },
  { id: 'game_of_thrones', title: 'Game of Thrones Theme', notes: [NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D#4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D#4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D#4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['D4']] },
  { id: 'never_gonna', title: 'Never Gonna Give You Up', notes: [NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['B4']] },
  { id: 'bohemian_rhapsody', title: 'Bohemian Rhapsody', notes: [NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4']] },
  { id: 'smoke_water', title: 'Smoke on the Water', notes: [NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['C#5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['G4']] },
  { id: 'seven_nation', title: 'Seven Nation Army', notes: [NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['B3'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4']] },
  { id: 'eye_of_tiger', title: 'Eye of the Tiger', notes: [NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4']] },
  { id: 'sweet_home_alabama', title: 'Sweet Home Alabama', notes: [NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4']] },
  { id: 'africa_toto', title: 'Africa (Toto)', notes: [NOTE_FREQUENCIES['F#5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['F#5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['E5']] },
  { id: 'dont_stop_believin', title: 'Dont Stop Believin Journey', notes: [NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['C#5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C#5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['B4']] },
  { id: 'shape_of_you', title: 'Shape of You (Ed Sheeran)', notes: [NOTE_FREQUENCIES['C#5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['F#5'], NOTE_FREQUENCIES['F#5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['E5']] },
  { id: 'blinding_lights', title: 'Blinding Lights (The Weeknd)', notes: [NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['F4']] },
  { id: 'despacito', title: 'Despacito', notes: [NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['B3'], NOTE_FREQUENCIES['D4']] },
  { id: 'believer', title: 'Believer (Imagine Dragons)', notes: [NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4']] },
  { id: 'uptown_funk', title: 'Uptown Funk', notes: [NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['C4']] },
  { id: 'happy_pharrell', title: 'Happy (Pharrell Williams)', notes: [NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5']] },
  { id: 'perfect', title: 'Perfect (Ed Sheeran)', notes: [NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['G4']] },
  { id: 'someone_like_you', title: 'Someone Like You (Adele)', notes: [NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['G#4']] },
  { id: 'rolling_deep', title: 'Rolling in the Deep (Adele)', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D#4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D#4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A#3'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D#4']] },
  { id: 'my_heart_go_on', title: 'My Heart Will Go On (Titanic)', notes: [NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4']] },
  { id: 'let_it_go', title: 'Let It Go (Frozen)', notes: [NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['C5']] },
  { id: 'circle_of_life', title: 'Circle of Life (Lion King)', notes: [NOTE_FREQUENCIES['F5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['F5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['C5']] },
  { id: 'somewhere_rainbow', title: 'Somewhere Over the Rainbow', notes: [NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5']] },
  { id: 'sweet_child', title: 'Sweet Child O Mine (intro)', notes: [NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['F#5'], NOTE_FREQUENCIES['A5'], NOTE_FREQUENCIES['G5']] },
  { id: 'stairway_heaven', title: 'Stairway to Heaven (intro)', notes: [NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4']] },
  { id: 'hotel_california', title: 'Hotel California (intro)', notes: [NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['A4']] },
  { id: 'nothing_else', title: 'Nothing Else Matters (intro)', notes: [NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['D5']] },
  { id: 'wish_you_here', title: 'Wish You Were Here (Pink Floyd)', notes: [NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4']] },
  { id: 'doom_e1m1', title: 'DOOM E1M1', notes: [NOTE_FREQUENCIES['E3'], NOTE_FREQUENCIES['E3'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E3'], NOTE_FREQUENCIES['E3'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E3'], NOTE_FREQUENCIES['E3'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E3'], NOTE_FREQUENCIES['E3'], NOTE_FREQUENCIES['A#3'], NOTE_FREQUENCIES['E3'], NOTE_FREQUENCIES['B3']] },
  { id: 'sonic_theme', title: 'Sonic the Hedgehog', notes: [NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['D5']] },
  { id: 'dont_cry_gnr', title: 'Sweet Child Intro (GNR)', notes: [NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['F#5'], NOTE_FREQUENCIES['A5'], NOTE_FREQUENCIES['G5'], NOTE_FREQUENCIES['F#5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['E5'], NOTE_FREQUENCIES['D5']] },
  { id: 'ironman_riff', title: 'Iron Man Riff (Black Sabbath)', notes: [NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['B4']] },
  { id: 'lavender_blue', title: 'Lavender Blue', notes: [NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4']] },
  { id: 'hot_stuff', title: 'Hot Stuff (Donna Summer)', notes: [NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['E4']] },
  { id: 'september_earth', title: 'September (Earth Wind Fire)', notes: [NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['D5']] },
  { id: 'billie_jean', title: 'Billie Jean (Michael Jackson)', notes: [NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F#4']] },
  { id: 'thriller', title: 'Thriller (Michael Jackson)', notes: [NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['C4'], NOTE_FREQUENCIES['D4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['E4']] },
  { id: 'beat_it', title: 'Beat It (Michael Jackson)', notes: [NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['E4'], NOTE_FREQUENCIES['D4']] },
  { id: 'stay_alive', title: 'Stayin Alive (Bee Gees)', notes: [NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['A#4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['G#4'], NOTE_FREQUENCIES['F#4'], NOTE_FREQUENCIES['D#4']] },
  { id: 'we_are_family', title: 'We Are Family (Sister Sledge)', notes: [NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['F4'], NOTE_FREQUENCIES['G4']] },
  { id: 'ymca', title: 'YMCA (Village People)', notes: [NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['D5'], NOTE_FREQUENCIES['C5'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['A4'], NOTE_FREQUENCIES['B4'], NOTE_FREQUENCIES['G4'], NOTE_FREQUENCIES['A4']] },
];
