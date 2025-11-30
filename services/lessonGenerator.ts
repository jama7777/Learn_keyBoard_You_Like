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
  "Woven silk pyjamas exchanged for quarters."
];

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function randomItem<T>(arr: T[]): T {
  return arr[randomInt(arr.length)];
}

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
  switch (mode) {
    case LessonMode.HOME_ROW: {
      const keys = "asdfghjkl;".split('');
      // Mix of patterns and existing home-row words
      const words = ["asdf", "jkl;", "dad", "sad", "lad", "fall", "flask", "half", "ask", "all", "has", "had", "glass", "sash", "jag", "add", "salad", "dad", "fad", "gash", "flag"];
      
      let content = [];
      // Add some pure muscle memory patterns
      content.push(generateRandomPattern(keys, 3, 4));
      // Add random words
      for(let i=0; i<8; i++) content.push(randomItem(words));
      // Add more patterns
      content.push(generateRandomPattern(keys, 3, 3));
      
      return content.sort(() => Math.random() - 0.5).join(' ');
    }
    
    case LessonMode.TOP_ROW: {
      const keys = "qwertyuiop".split('');
      const words = ["top", "pot", "toy", "tree", "try", "type", "write", "quit", "power", "quiet", "were", "we", "you", "your", "tier", "row", "rope"];
      let content = [];
      content.push(generateRandomPattern(keys, 3, 5));
      for(let i=0; i<8; i++) content.push(randomItem(words));
      return content.sort(() => Math.random() - 0.5).join(' ');
    }

    case LessonMode.BOTTOM_ROW: {
      const keys = "zxcvbnm,.".split('');
      const words = ["zoo", "van", "ban", "man", "cab", "can", "mix", "zen", "zero", "moon", "bomb", "vac"];
      let content = [];
      content.push(generateRandomPattern(keys, 3, 4));
      for(let i=0; i<8; i++) content.push(randomItem(words));
      return content.sort(() => Math.random() - 0.5).join(' ');
    }
    
    case LessonMode.NUMBERS: {
      return generateRandomPattern("0123456789".split(''), 10, 5);
    }

    case LessonMode.ALPHANUMERIC: {
      // Numbers with alphabets
      const letters = "abcdefghijklmnopqrstuvwxyz".split('');
      const numbers = "0123456789".split('');
      const combined = [...letters, ...numbers];
      
      // Generate IDs or codes style
      const p1 = generateRandomPattern(combined, 4, 4);
      const p2 = generateRandomPattern(numbers, 2, 5);
      const p3 = generateRandomPattern(letters, 2, 5);
      
      return `${p1} ${p2} ${p3} ${generateRandomPattern(combined, 3, 6)}`.split(' ').sort(() => Math.random() - 0.5).join(' ');
    }
    
    case LessonMode.SYMBOLS: {
       const chars = "!@#$%^&*()".split('');
       const numbers = "0123456789".split('');
       return generateRandomPattern([...chars, ...numbers], 10, 5) + " " + generateRandomPattern(chars, 5, 3);
    }
    
    case LessonMode.ALL: 
    case LessonMode.ALPHABETS: {
        // Randomly choose between sentence mode or random word mode
        const modeRoll = Math.random();
        if (modeRoll > 0.6) {
             // 2 Random sentences
             return randomItem(SENTENCES) + " " + randomItem(SENTENCES);
        } else if (modeRoll > 0.3) {
             // Random common words
             let w = [];
             for(let i=0; i<15; i++) w.push(randomItem(COMMON_WORDS));
             return w.join(' ');
        } else {
             // Paragraph style
             const s1 = randomItem(SENTENCES);
             const s2 = randomItem(SENTENCES);
             return `${s1} ${s2}`;
        }
    }

    default:
       return "The quick brown fox jumps over the lazy dog.";
  }
};