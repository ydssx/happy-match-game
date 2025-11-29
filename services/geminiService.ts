import { GoogleGenAI } from "@google/genai";

// Initialize the API client
// We assume process.env.API_KEY is available.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const getGameEncouragement = async (
  status: 'WON' | 'LOST',
  score: number,
  movesLeft: number
): Promise<string> => {
  if (!apiKey) return "Great game! (AI key missing for personalized message)";

  try {
    const prompt = status === 'WON' 
      ? `I just beat a level in a Match-3 game! Score: ${score}, Moves left: ${movesLeft}. Give me a very short, funny, enthusiastic congratulatory message (max 2 sentences) with emojis.`
      : `I just lost a Match-3 game level. Score: ${score}. Give me a short, funny, encouraging message to try again (max 2 sentences) with emojis.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return status === 'WON' ? "You are a puzzle master! 🌟" : "Don't give up! Try again! 💪";
  }
};
