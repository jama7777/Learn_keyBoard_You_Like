import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

export const generateLessonContent = async (topic: string, format: string = 'Paragraph'): Promise<string> => {
  // Lazy initialization
  if (!ai) {
    const apiKey = process.env.API_KEY || '';
    ai = new GoogleGenAI({ apiKey });
  }

  try {
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text?.trim() || '';
    
    // Clean up markdown code fences if present (Gemini sometimes adds them despite instructions)
    let cleanText = text.replace(/```[a-z]*\n?/g, '').replace(/```/g, '');

    // We do NOT replace newlines with spaces anymore, to support code/structured text.
    return cleanText.trim();

  } catch (error) {
    console.error("Gemini generation error:", error);
    return "Failed to generate lesson content. Please check your internet connection or API key configuration.";
  }
};