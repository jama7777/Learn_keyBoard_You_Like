import { GoogleGenAI } from "@google/genai";

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
      Topic: ${topic}.
      Difficulty: Intermediate.
      Length: About 40-60 words (or lines for code).
      Requirements:
      - Use proper punctuation and capitalization.
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