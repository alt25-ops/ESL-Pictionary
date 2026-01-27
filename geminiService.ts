
import { GoogleGenAI, Type } from "@google/genai";
import { GameWord, Difficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateWord = async (difficulty: Difficulty, category: string): Promise<GameWord> => {
  const prompt = `Generate a Pictionary word for a junior high school ESL student. 
  Difficulty: ${difficulty}. 
  Category: ${category}. 
  Provide the word and a short, simple English hint (no complex grammar).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            hint: { type: Type.STRING },
            category: { type: Type.STRING },
          },
          required: ["word", "hint", "category"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      word: result.word || "Apple",
      hint: result.hint || "A red fruit.",
      level: difficulty,
      category: category,
    };
  } catch (error) {
    console.error("Error generating word:", error);
    return {
      word: "Backpack",
      hint: "You carry books in this to school.",
      level: difficulty,
      category: category,
    };
  }
};

export const checkGuess = async (guess: string, word: string): Promise<boolean> => {
    // Basic string comparison is usually enough for simple words,
    // but we could use Gemini to check synonyms or close misspellings.
    return guess.toLowerCase().trim() === word.toLowerCase().trim();
};
