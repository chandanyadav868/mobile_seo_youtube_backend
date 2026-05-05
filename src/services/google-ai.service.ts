import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";

const ai = new GoogleGenAI({ apiKey: config.googleAiApiKey });

export class GoogleAIService {
  static async generateMetadata(promptPayload: any) {
    const modelName = "gemma-4-31b-it";

    const prompt = `
      You are a World-Class YouTube SEO and Growth Strategist.
      Goal: Generate high-performing metadata based on the provided corpus of successful RECENT videos.
        
      Market Context (Top Recent Viral Videos):
      ${JSON.stringify(promptPayload, null, 2)}
        
      Instructions:
      1. Title Ideas: Create 10 ultra-clickable, SEO-optimized titles.
      2. Description Draft: Write a comprehensive, SEO-friendly description.
      3. Tags: Provide 15 high-volume, relevant tags.
      4. Hashtags: Provide 12 relevant hashtags.
      5. Content Ideas: Provide 8 unique angles.
        
      Formatting: Return ONLY a valid JSON object with keys: titleIdeas,      descriptionDraft, tags, hashtags, ideas. 
      DO NOT include any markdown formatting.
    `;

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      const text = response.text?.trim() || "";
      const cleanedText = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error("AI Generation Service Error:", error);
      throw error;
    }
  }
}
