import { Song } from "../types";
import { NOTE_FREQUENCIES } from "../constants";

/**
 * Client-side AI service.
 *
 * IMPORTANT: this file no longer touches any API key or makes a direct call to
 * Google/OpenRouter. Every network call goes to our own /api/ai/generate route,
 * which holds the key server-side. The previous version inlined the raw key into
 * the browser bundle via Vite's `define`, so it was publicly readable.
 *
 * Parsing, note mapping and the local fallback content stay here because they
 * are pure functions that run fine in the browser.
 */

/**
 * Calls the server AI proxy. Never throws — returns an error string instead, so
 * callers keep their existing "show the message in the UI" behaviour.
 */
async function callAI(
  prompt: string,
  options: { mimeType?: string; data?: string; model?: string } = {},
): Promise<string> {
  try {
    const response = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        mimeType: options.mimeType,
        data: options.data,
        model: options.model,
      }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return payload.error || `AI Error: HTTP ${response.status}`;
    }
    return payload.text ?? "";
  } catch (error) {
    console.error("[AI Service] Proxy call failed:", error);
    return "Network error reaching the AI service. Check your connection and try again.";
  }
}

const LOCAL_FALLBACK_CONTENT: Record<string, string[]> = {
  default: [
    "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump.",
    "Practice makes perfect. Every keystroke brings you closer to mastery. Focus on accuracy before speed and the words will flow naturally.",
    "Typing is a skill that improves with daily practice. Keep your fingers on the home row and let muscle memory guide each key.",
    "The best way to improve your typing speed is to type regularly. Start slow, focus on accuracy, and speed will follow naturally over time.",
    "Keep your wrists relaxed and your posture straight. A comfortable typing position reduces fatigue and helps you type faster and more accurately.",
  ],
  technology: [
    "Software developers write code every day to build applications that millions of people use. Learning to type faster makes coding more efficient and enjoyable.",
    "Artificial intelligence is transforming the way we work and live. From voice assistants to self-driving cars, technology continues to reshape our world.",
    "Cloud computing allows businesses to store and access data remotely. This technology enables collaboration across teams working in different locations worldwide.",
  ],
  python: [
    `# Python basics\ndef greet(name):\n    return f"Hello, {name}!"\n\nfor i in range(5):\n    print(greet(f"User {i}"))`,
    `# List comprehension example\nnumbers = [1, 2, 3, 4, 5]\nsquares = [x ** 2 for x in numbers]\nprint(squares)  # Output: [1, 4, 9, 16, 25]`,
  ],
  javascript: [
    `// Arrow function example\nconst add = (a, b) => a + b;\nconst result = add(3, 7);\nconsole.log(result); // 10`,
    `// Array methods\nconst names = ['Alice', 'Bob', 'Carol'];\nconst upper = names.map(n => n.toUpperCase());\nconsole.log(upper);`,
  ],
  science: [
    "The laws of thermodynamics govern energy transfer in the universe. The first law states that energy cannot be created or destroyed, only transformed.",
    "DNA carries the genetic information that determines the traits of living organisms. Each cell contains billions of base pairs encoded in the double helix structure.",
  ],
  history: [
    "The Renaissance was a cultural movement that began in Italy during the 14th century. It brought renewed interest in art, science, and classical learning.",
    "The Industrial Revolution transformed manufacturing and transportation in the 18th and 19th centuries, fundamentally changing how people worked and lived.",
  ],
  nature: [
    "The Amazon rainforest produces about twenty percent of the world's oxygen. It is home to millions of species of plants, animals, and insects.",
    "Oceans cover more than seventy percent of the Earth's surface. They regulate climate, provide food, and are home to the majority of life on Earth.",
  ],
};

const getLocalFallback = (topic: string, format: string): string => {
  const lower = topic.toLowerCase();
  let pool = LOCAL_FALLBACK_CONTENT.default;
  for (const key of Object.keys(LOCAL_FALLBACK_CONTENT)) {
    if (lower.includes(key)) { pool = LOCAL_FALLBACK_CONTENT[key]; break; }
  }
  if (format.includes('Python')) pool = LOCAL_FALLBACK_CONTENT.python;
  if (format.includes('JS')) pool = LOCAL_FALLBACK_CONTENT.javascript;
  return pool[Math.floor(Math.random() * pool.length)];
};

/** Maps a note string like "Bb4", "C#3", "D4" to a frequency number */
const noteToFrequency = (note: string): number => {
  if (!note || typeof note !== 'string') return 0;
  let n = note.trim().toUpperCase().replace(/\s+/g, '');
  if (n.includes('B') && !n.startsWith('B')) {
     n = n.replace('B', 'b');
  }
  n = n
    .replace(/^DB(\d+)$/, 'C#$1').replace(/^Db(\d+)$/i, 'C#$1')
    .replace(/^EB(\d+)$/, 'D#$1').replace(/^Eb(\d+)$/i, 'D#$1')
    .replace(/^GB(\d+)$/, 'F#$1').replace(/^Gb(\d+)$/i, 'F#$1')
    .replace(/^AB(\d+)$/, 'G#$1').replace(/^Ab(\d+)$/i, 'G#$1')
    .replace(/^BB(\d+)$/, 'A#$1').replace(/^Bb(\d+)$/i, 'A#$1')
    .replace(/[^A-Z#0-9]/g, '');
  return NOTE_FREQUENCIES[n] || 0;
};

const parseJson = (text: string): any => {
  if (!text) return null;
  let cleaned = text
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/```\s*$/im, '')
    .trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const match = cleaned.match(/\{[\s\S]*?\}/);
  if (match) { try { return JSON.parse(match[0]); } catch { /* ignore */ } }
  const bigMatch = cleaned.match(/\{[\s\S]*\}/);
  if (bigMatch) { try { return JSON.parse(bigMatch[0]); } catch { /* ignore */ } }
  return null;
};

const notesToFrequencies = (notes: string[]): number[] =>
  notes.map(noteToFrequency).filter(f => f > 0);

const BUILTIN_MELODIES: Record<string, { title: string; notes: string[] }> = {
  'happy birthday': {
    title: 'Happy Birthday',
    notes: ['C4','C4','D4','C4','F4','E4','C4','C4','D4','C4','G4','F4','C4','C4','C5','A4','F4','E4','D4','A#4','A#4','A4','F4','G4','F4']
  },
  'twinkle': {
    title: 'Twinkle Twinkle Little Star',
    notes: ['C4','C4','G4','G4','A4','A4','G4','F4','F4','E4','E4','D4','D4','C4']
  },
  'ode to joy': {
    title: 'Ode to Joy',
    notes: ['E4','E4','F4','G4','G4','F4','E4','D4','C4','C4','D4','E4','E4','D4','D4']
  },
  'birthday': {
    title: 'Happy Birthday',
    notes: ['C4','C4','D4','C4','F4','E4','C4','C4','D4','C4','G4','F4','C4','C4','C5','A4','F4','E4','D4','A#4','A#4','A4','F4','G4','F4']
  },
  'mario': {
    title: 'Super Mario Theme',
    notes: ['E5','E5','E5','C5','E5','G5','G4','C5','G4','E4','A4','B4','A#4','A4','G4','E5','G5','A5','F5','G5','E5','C5','D5','B4']
  },
  'tetris': {
    title: 'Tetris Theme',
    notes: ['E5','B4','C5','D5','C5','B4','A4','A4','C5','E5','D5','C5','B4','B4','C5','D5','E5','C5','A4','A4']
  },
  'jingle bells': {
    title: 'Jingle Bells',
    notes: ['E4','E4','E4','E4','E4','E4','E4','G4','C4','D4','E4','F4','F4','F4','F4','F4','E4','E4','E4','E4','D4','D4','E4','D4','G4']
  },
  'fur elise': {
    title: 'Fur Elise',
    notes: ['E5','D#5','E5','D#5','E5','B4','D5','C5','A4','C4','E4','A4','B4','E4','G#4','B4','C5','E4','E5','D#5','E5','D#5','E5','B4','D5','C5','A4']
  },
};

const findBuiltinMelody = (description: string): Song | null => {
  const lower = description.toLowerCase();
  for (const [key, val] of Object.entries(BUILTIN_MELODIES)) {
    if (lower.includes(key)) {
      const frequencies = notesToFrequencies(val.notes);
      if (frequencies.length > 0) {
        return { id: `builtin_${Date.now()}`, title: val.title, notes: frequencies };
      }
    }
  }
  return null;
};

export const generateLessonContent = async (topic: string, format: string = 'Paragraph'): Promise<string> => {
  let typeInstruction = '';
  if (format.startsWith('Code (')) {
    const lang = format.slice(6, -1);
    typeInstruction = `Write valid ${lang} code snippet with comments. Preserve indentation and newlines. Do not use markdown backticks.`;
  } else {
    switch (format) {
      case 'Story': typeInstruction = 'Write a short, engaging creative story. Use paragraphs.'; break;
      case 'Business Letter': typeInstruction = 'Write a professional formal letter body. Preserve standard letter spacing.'; break;
      case 'Abstract': typeInstruction = 'Write a dense, academic abstract style paragraph.'; break;
      default: typeInstruction = 'Generate a plain text paragraph.';
    }
  }
  const prompt = `Task: ${typeInstruction}\nTopic/Input: "${topic}"\nInstructions:\n1. CRITICAL: If the Topic/Input appears to be a list of keys (e.g., "a,s,d,f", "numbers", "home row", "qwer"), ignore the Task format and instead generate a repetitive typing drill sequence using strictly those characters (and space).\n2. If it is a normal topic, follow the Task format requested. Length: ~50 words.\n3. Requirements: Use proper punctuation and capitalization for prose. No markdown formatting. Just raw text ready to be typed.`;

  const text = await callAI(prompt);

  if (!text) {
    // Distinguish a real API failure from a short/drill topic so we only fall
    // back to canned text when it will not look wrong.
    if (topic.length > 5) {
      return `AI Generation failed: empty response. Please try again later.`;
    }
    return getLocalFallback(topic, format);
  }

  // Surface the server's own error message instead of a canned paragraph.
  if (text.startsWith('AI Error:') || text.startsWith('Rate limit') || text.startsWith('The model provider')) {
    return text;
  }

  return text.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
};

export const processFileContent = async (base64Data: string, mimeType: string): Promise<string> => {
  const base64String = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
  const prompt = `Transcribe the content of this file exactly as it appears. Return ONLY the raw text content, no commentary.`;

  const text = await callAI(prompt, { data: base64String, mimeType });
  if (text.startsWith('AI Error:') || text.startsWith('Network error') || text.startsWith('Rate limit')) {
    return `Error processing file: ${text}`;
  }
  return text.replace(/^```[a-z]*\n?/, '').replace(/```$/, '').trim();
};

export const extractMelodyFromAudio = async (base64Data: string, mimeType: string): Promise<Song | null> => {
  const base64String = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
  const prompt = `Listen to this audio. Identify the song name if known, then transcribe its main melody as musical notes.
Return ONLY raw JSON (no markdown):
{"title": "Song Name", "notes": ["C4","E4","G4","C5"]}
Rules: Use ONLY sharps notation. Allowed notes: C3 C#3 D3 D#3 E3 F3 F#3 G3 G#3 A3 A#3 B3 C4 C#4 D4 D#4 E4 F4 F#4 G4 G#4 A4 A#4 B4 C5 C#5 D5 D#5 E5 F5 F#5 G5 G#5 A5 A#5 B5 C6. NEVER use Bb Db Eb Gb Ab. Include 20-40 notes.`;

  const text = await callAI(prompt, { data: base64String, mimeType });
  if (!text || text.startsWith('AI Error:') || text.startsWith('Network error')) return null;

  const result = parseJson(text);
  if (result?.notes && Array.isArray(result.notes)) {
    const frequencies = notesToFrequencies(result.notes);
    if (frequencies.length > 0) {
      return { id: `upload_${Date.now()}`, title: result.title || 'Uploaded Melody', notes: frequencies };
    }
  }
  return null;
};

export const fixGrammar = async (text: string): Promise<string> => {
  const prompt = `Correct all spelling, grammar, and punctuation errors in this text. Return ONLY the corrected text, no commentary:\n\n${text}`;
  const result = await callAI(prompt);
  if (result.startsWith('AI Error:') || result.startsWith('Network error')) return text;
  return result.trim() || text;
};

export const generateSong = async (description: string): Promise<Song | null> => {
  const builtin = findBuiltinMelody(description);
  if (builtin) return builtin;

  const prompt = `Create a melody for: "${description}"
Return ONLY this exact JSON format (no backticks, no markdown, no explanation):
{"title":"Song Name","notes":["C4","E4","G4","A4","G4","F4","E4","C4"]}
RULES:
- notes must be from: C3 C#3 D3 D#3 E3 F3 F#3 G3 G#3 A3 A#3 B3 C4 C#4 D4 D#4 E4 F4 F#4 G4 G#4 A4 A#4 B4 C5 C#5 D5 D#5 E5 F5 F#5 G5 G#5 A5 A#5 B5 C6
- NEVER use: Bb Db Eb Gb Ab Cb Fb
- Include exactly 28-36 notes`;

  const text = await callAI(prompt);
  if (!text || text.startsWith('AI Error:') || text.startsWith('Network error')) return null;

  const result = parseJson(text);
  if (result?.notes && Array.isArray(result.notes) && result.notes.length > 0) {
    const frequencies = notesToFrequencies(result.notes);
    if (frequencies.length >= 5) {
      return { id: `ai_${Date.now()}`, title: result.title || description, notes: frequencies };
    }
  }
  return null;
};
