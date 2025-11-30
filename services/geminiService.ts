import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

export const generateLessonContent = async (topic: string): Promise<string> => {
  // Lazy initialization: Only create the client when needed.
  // This prevents the app from crashing on load if process.env is not defined in the global scope.
  if (!ai) {
    const apiKey = process.env.API_KEY || '';
    ai = new GoogleGenAI({ apiKey });
  }

  try {
    const prompt = `
      Generate a plain text paragraph for typing practice.
      Topic: ${topic}.
      Difficulty: Intermediate.
      Length: About 30-40 words.
      Requirements:
      - Use proper punctuation and capitalization.
      - Make it engaging and factual.
      - No markdown, just raw text.
      - Do not include numbering or bullet points.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text?.trim() || '';
    
    // Cleanup newlines and excess whitespace to ensure smooth single-line or wrapped typing
    return text.replace(/\n/g, ' ').replace(/\s+/g, ' ');

  } catch (error) {
    console.error("Gemini generation error:", error);
    return "Failed to generate lesson content. Please check your internet connection or API key configuration.";
  }
};