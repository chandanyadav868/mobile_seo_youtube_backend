import { OpenRouter } from "@openrouter/sdk";
import dotenv from "dotenv";

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DEFAULT_MODEL = "openrouter/free";

export class OpenRouterService {
  private static client = new OpenRouter({
    apiKey: OPENROUTER_API_KEY,
    appTitle: "mobile_youtube_backend",
  });

  /**
   * Generates a comprehensive trending report using direct OpenRouter API.
   */
  static async generateTrendingReport(promptPayload: any, user: any) {
    try {
      const prompt = `
        You are a World-Class YouTube Trend Strategist.
        Goal: Turn raw YouTube search results into a high-level content strategy report.
        Constraint: Return JSON only with these keys: summary, contentAngles, titleIdeas, hooks, nextMoves.

        Focus only on the 15 latest search results provided.

        Trend Data:
        ${JSON.stringify(promptPayload, null, 2)}
      `;

      const response = await this.client.chat.send({
        chatRequest: {
          model: DEFAULT_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        },
      });

      console.log("Raw OpenRouter Response:", JSON.stringify(response, null, 2));

      const text = this.extractText(response);
      if (!text) {
        throw new Error("Empty response from OpenRouter");
      }

      return this.extractJson(text);
    } catch (error) {
      console.error("OpenRouter Service Error:", error);
      throw error;
    }
  }

  /**
   * Generates a comprehensive competitor analysis using direct OpenRouter API.
   */
  static async generateCompetitorAnalysis(promptPayload: any, user: any) {
    try {
      const prompt = `
        You are a YouTube channel strategy analyst.
        Goal: Turn channel data and video patterns into a creator-friendly strategy summary.
        Constraint: Return JSON only with these keys: summary, strengths, opportunities, uploadCadence, titlePatterns, keywordAngles, nextMoves.

        Keep the response concise, practical, and specific to creator growth.

        Channel Data:
        ${JSON.stringify(promptPayload, null, 2)}
      `;

      const response = await this.client.chat.send({
        chatRequest: {
          model: DEFAULT_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        },
      });

      console.log("Raw Competitor Analysis Response:", JSON.stringify(response, null, 2));

      const text = this.extractText(response);
      if (!text) {
        throw new Error("Empty response from OpenRouter");
      }

      return this.extractJson(text);
    } catch (error) {
      console.error("OpenRouter Competitor Analysis Error:", error);
      throw error;
    }
  }

  /**
   * Helper to extract text content from OpenRouter response.
   */
  private static extractText(response: any): string | null {
    if (typeof response === "string") return response;

    const content = response?.choices?.[0]?.message?.content || response?.content;
    if (!content) return null;

    if (typeof content === "string") return content;

    if (Array.isArray(content)) {
      return content
        .map((part: any) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object") {
            return part.text || part.content || "";
          }
          return "";
        })
        .filter(Boolean)
        .join("");
    }

    return null;
  }

  /**
   * Robustly extracts and parses JSON from text.
   */
  private static extractJson(text: string) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanedText = jsonMatch ? jsonMatch[0] : text;

    try {
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON Parse Error. Raw text:", text);
      throw new Error("Failed to parse AI response into valid JSON");
    }
  }
}
