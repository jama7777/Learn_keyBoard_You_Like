import { GoogleGenAI, Type } from "@google/genai";
import { Song } from "../types";
import { NOTE_FREQUENCIES } from "../constants";

let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY || '';
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const generateLessonContent = async (topic: string, format: string = 'Paragraph'): Promise<string> => {
  try {
    const client = getAI();
    let typeInstruction = '';
    
    switch (format) {
      case 'Story':
        typeInstruction = 'Write a short, engaging creative story. Use paragraphs.';
        break;
      case 'Business Letter':
        typeInstruction = 'Write a professional formal letter structure (skip address blocks, just body). Preserve standard letter spacing.';
        break;
      case 'Abstract':
        typeInstruction = 'Write a dense, academic abstract style paragraph.';
        break;
      case 'Code (Python)':
        typeInstruction = 'Write valid Python code snippet with comments. Preserve indentation and newlines. Do not use markdown backticks.';
        break;
      case 'Code (JS)':
        typeInstruction = 'Write valid JavaScript code snippet with comments. Preserve indentation and newlines. Do not use markdown backticks.';
        break;
      default:
        typeInstruction = 'Generate a plain text paragraph.';
    }

    const prompt = `
      Task: ${typeInstruction}
      Topic/Input: "${topic}"

      Instructions:
      1. CRITICAL: If the Topic/Input appears to be a list of keys (e.g., "a,s,d,f", "numbers", "home row", "qwer"), ignore the 'Task' format and instead generate a repetitive typing drill sequence using strictly those characters (and space).
         - Example Input: "a, s" -> Output: "asas sasa assa saas..."
         - Example Input: "numbers" -> Output: "123 456 7890 1029..."
         - Length for drills: ~150 characters.
      2. If it is a normal topic (e.g., "Space", "Cooking"), follow the 'Task' format (Story, Code, etc.) requested. Length: ~50 words.
      3. Requirements:
         - Use proper punctuation and capitalization for prose.
         - No markdown formatting (no bold, no italics, no code blocks/backticks).
         - Just raw text that is ready to be typed.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text?.trim() || '';
    let cleanText = text.replace(/```[a-z]*\n?/g, '').replace(/```/g, '');
    return cleanText.trim();

  } catch (error) {
    console.error("Gemini generation error:", error);
    return "Failed to generate lesson content. Please check your internet connection or API key configuration.";
  }
};

export const processFileContent = async (base64Data: string, mimeType: string): Promise<string> => {
  try {
    const client = getAI();
    
    // We remove the data URL prefix if present (e.g. "data:image/png;base64,")
    const base64String = base64Data.includes('base64,') 
      ? base64Data.split('base64,')[1] 
      : base64Data;

    const prompt = `
      Task: Transcribe the content of this file exactly as it appears.
      Requirements:
      - If it is a document, return the text content.
      - If it is code (screenshot or text), return the code preserving indentation.
      - If it is a mix, transcribe all visible text.
      - Do not add any conversational filler like "Here is the text".
      - Return ONLY the raw content.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64String
            }
          },
          { text: prompt }
        ]
      }
    });

    const text = response.text?.trim() || '';
    // Clean potential markdown code blocks if the model wrapped the output
    let cleanText = text.replace(/^```[a-z]*\n?/, '').replace(/```$/, '');
    
    return cleanText.trim();
  } catch (error) {
    console.error("Gemini file processing error:", error);
    return "Error processing file. Please ensure it is a valid Image or PDF.";
  }
};

export const extractMelodyFromAudio = async (base64Data: string, mimeType: string): Promise<Song | null> => {
  try {
    const client = getAI();
    const base64String = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;

    const prompt = `
      Listen to this audio. Extract the main melody notes as a sequence.
      Return a JSON object:
      {
        "title": "Song Title (or 'Uploaded Melody')",
        "notes": ["C4", "E4", "G4", ...]
      }
      Rules:
      - Identify the dominant melody.
      - Use standard scientific pitch notation (e.g., C3 to C6).
      - If complex, simplify to a single monophonic line suitable for a typing game.
      - Limit to around 32-50 notes.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
           { inlineData: { mimeType: mimeType, data: base64String } },
           { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            notes: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    if (result.notes && Array.isArray(result.notes)) {
      const frequencies: number[] = result.notes
        .map((note: string) => NOTE_FREQUENCIES[note] || NOTE_FREQUENCIES[note.toUpperCase()] || 0)
        .filter((freq: number) => freq > 0);
        
      if (frequencies.length > 0) {
        return {
          id: `upload_${Date.now()}`,
          title: result.title || 'Uploaded Melody',
          notes: frequencies
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini audio processing error:", error);
    return null;
  }
};

export const fixGrammar = async (text: string): Promise<string> => {
  try {
    const client = getAI();
    const prompt = `
      Task: Correct all spelling, grammar, and punctuation errors in the provided text.
      Requirements:
      - Return ONLY the rectified text.
      - Maintain the original meaning and general tone.
      - Preserve newlines and paragraph structure.
      - Do not add any conversational filler (e.g., "Here is the corrected version").
      
      Text to rectify:
      ${text}
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini grammar fix error:", error);
    return text; // Fallback to original if error
  }
};

export const generateSong = async (description: string): Promise<Song | null> => {
  try {
    const client = getAI();
    const prompt = `
      Create a musical melody sequence based on this request: "${description}".
      
      If the request is a specific song name (e.g. "Brooklyn Baby", "Love Me Like You Do"), generate the actual main melody notes for that song.
      If it's a vibe (e.g. "Sad", "Fast"), generate a creative melody matching it.

      Return a JSON object with this schema:
      {
        "title": "Title of song",
        "notes": ["C4", "E4", "G4", ...]
      }
      
      Rules:
      - Use ONLY standard scientific pitch notation (e.g., C3, C#3, D3 ... up to C6).
      - The melody should be monophonic (one note at a time).
      - Length: 20 to 50 notes.
      - Make it recognizable if it is a famous song.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            notes: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    if (result.notes && Array.isArray(result.notes)) {
      // Map note names to frequencies
      const frequencies: number[] = result.notes
        .map((note: string) => NOTE_FREQUENCIES[note] || NOTE_FREQUENCIES[note.toUpperCase()] || 0)
        .filter((freq: number) => freq > 0);
        
      if (frequencies.length > 0) {
        return {
          id: `ai_${Date.now()}`,
          title: result.title || 'AI Melody',
          notes: frequencies
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini music generation error:", error);
    return null;
  }
};