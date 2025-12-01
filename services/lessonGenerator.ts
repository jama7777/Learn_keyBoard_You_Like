import { LessonMode } from '../types';

const COMMON_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", 
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", 
  "their", "what", "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", 
  "just", "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", "other", "than", "then", 
  "now", "look", "only", "come", "its", "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well", 
  "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us"
];

const SENTENCES = [
  "The quick brown fox jumps over the lazy dog.",
  "Pack my box with five dozen liquor jugs.",
  "Sphinx of black quartz, judge my vow.",
  "Two driven jocks help fax my big quiz.",
  "The five boxing wizards jump quickly.",
  "How vexingly quick daft zebras jump!",
  "Bright vixens jump; dozy fowl quack.",
  "Jinxed wizards pluck ivy from the big quilt.",
  "Crazy Fredrick bought many very exquisite opal jewels.",
  "We promptly judged antique ivory buckles for the next prize.",
  "Jaded zombies acted quaintly but kept driving their oxen forward.",
  "A wizard’s job is to vex chumps quickly in fog.",
  "Watch 'Jeopardy!', Alex Trebek's fun TV quiz game.",
  "By Jove, my quick study of lexicography won a prize!",
  "Woven silk pyjamas exchanged for quarters.",
  "Amazingly few discotheques provide jukeboxes.",
  "Heavy boxes perform quick waltzes and jigs."
];

// Helper: Get random integer 0 to max-1
function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

// Helper: Get random item from array
function randomItem<T>(arr: T[]): T {
  if (arr.length === 0) return undefined as any;
  return arr[randomInt(arr.length)];
}

// Helper: Fisher-Yates Shuffle for true randomness
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// Helper: Generate a string of random groups (e.g., "jkfd lksd")
function generateRandomPattern(chars: string[], count: number, groupSize: number): string {
  const groups = [];
  for (let i = 0; i < count; i++) {
    let group = "";
    for (let j = 0; j < groupSize; j++) {
      group += randomItem(chars);
    }
    groups.push(group);
  }
  return groups.join(' ');
}

export const generateLessonText = (mode: LessonMode): string => {
  let contentParts: string[] = [];

  switch (mode) {
    case LessonMode.HOME_ROW: {
      const keys = "asdfghjkl;".split('');
      const words = ["asdf", "jkl;", "dad", "sad", "lad", "fall", "flask", "half", "ask", "all", "has", "had", "glass", "sash", "jag", "add", "salad", "fad", "gash", "flag", "hall", "dash", "slash"];
      
      // Structure: Pattern -> Words -> Pattern -> Words
      contentParts.push(generateRandomPattern(keys, 2, 4));
      contentParts.push(shuffleArray(words).slice(0, 5).join(' '));
      contentParts.push(generateRandomPattern(keys, 2, 5));
      contentParts.push(shuffleArray(words).slice(0, 5).join(' '));
      break;
    }
    
    case LessonMode.TOP_ROW: {
      const keys = "qwertyuiop".split('');
      const words = ["top", "pot", "toy", "tree", "try", "type", "write", "quit", "power", "quiet", "were", "we", "you", "your", "tier", "row", "rope", "pour", "router", "writer", "prop"];
      
      contentParts.push(generateRandomPattern(keys, 3, 4));
      contentParts.push(shuffleArray(words).slice(0, 8).join(' '));
      break;
    }

    case LessonMode.BOTTOM_ROW: {
      const keys = "zxcvbnm,.".split('');
      const words = ["zoo", "van", "ban", "man", "cab", "can", "mix", "zen", "zero", "moon", "bomb", "vac", "cave", "name", "bacon", "zone"];
      
      contentParts.push(generateRandomPattern(keys, 3, 4));
      contentParts.push(shuffleArray(words).slice(0, 8).join(' '));
      break;
    }
    
    case LessonMode.NUMBERS: {
      const nums = "0123456789".split('');
      // Generate phone number style and random blocks
      contentParts.push(generateRandomPattern(nums, 4, 3));
      contentParts.push(generateRandomPattern(nums, 4, 4));
      contentParts.push(generateRandomPattern(nums, 4, 2));
      break;
    }

    case LessonMode.ALPHANUMERIC: {
      const letters = "abcdefghijklmnopqrstuvwxyz".split('');
      const numbers = "0123456789".split('');
      const combined = [...letters, ...numbers];
      
      // Mix of patterns: "abc1", "123a", etc.
      contentParts.push(generateRandomPattern(combined, 3, 4)); // mixed 4 chars
      contentParts.push(generateRandomPattern(numbers, 2, 3));  // pure numbers
      contentParts.push(generateRandomPattern(letters, 2, 3));  // pure letters
      contentParts.push(generateRandomPattern(combined, 3, 5)); // mixed 5 chars
      break;
    }
    
    case LessonMode.SYMBOLS: {
       const syms = "!@#$%^&*()".split('');
       const numbers = "0123456789".split('');
       const mixed = [...syms, ...numbers];
       
       contentParts.push(generateRandomPattern(mixed, 5, 4));
       contentParts.push(generateRandomPattern(syms, 5, 2));
       break;
    }
    
    case LessonMode.ALL: 
    case LessonMode.ALPHABETS: 
    default: {
        const roll = Math.random();
        if (roll > 0.5) {
             // 2 Random sentences
             const s = shuffleArray(SENTENCES);
             return s[0] + " " + s[1];
        } else {
             // Random common words paragraph
             const w = shuffleArray(COMMON_WORDS).slice(0, 12);
             return w.join(' ');
        }
    }
  }

  // Shuffle the parts themselves so the "Pattern -> Words" structure isn't always the same order
  return shuffleArray(contentParts).join(' ');
};