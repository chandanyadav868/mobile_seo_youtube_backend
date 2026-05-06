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
   * Generates a side-by-side video comparison analysis using OpenRouter.
   */
  static async generateVideoComparison(promptPayload: any, user: any) {
    try {
      const prompt = `
        You are a YouTube SEO and Growth Expert.
        Goal: Compare 2 or more videos to identify why one is outperforming the others.
        Constraint: Return JSON only with these keys: 
        - comparisonSummary (string: high-level overview of the performance gap)
        - metadataAnalysis (array of objects: breakdown of titles, tags, and description effectiveness for each video)
        - viewVelocityDrivers (array of strings: bullet points why the top video is winning)
        - improvementRoadmap (array of strings: step-by-step SEO and content changes for the underperforming videos)
        - winningFormula (string: what to replicate from the top video)

        Keep the analysis deep, technical (SEO-wise), and creator-centric. 
        IMPORTANT: Always ensure viewVelocityDrivers and improvementRoadmap are returned as arrays, even if they only contain one item.

        Videos Data:
        ${JSON.stringify(promptPayload, null, 2)}
      `;

      const response = await this.client.chat.send({
        chatRequest: {
          model: DEFAULT_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        },
      });

      console.log("Raw Video Comparison Response:", JSON.stringify(response, null, 2));

      const text = this.extractText(response);
      if (!text) {
        throw new Error("Empty response from OpenRouter");
      }

      return this.extractJson(text);
    } catch (error) {
      console.error("OpenRouter Video Comparison Error:", error);
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

  static async enhanceSeo(payload: any, user: any) {
    const isPremium = user?.plan === "PREMIUM";
    const titleVariations = isPremium ? 3 : 1;
    const tagVariations = isPremium ? 2 : 1;

    const prompt = `You are an elite YouTube SEO specialist. Your goal is to optimize the user's drafted metadata based on two top-performing competitor videos provided.
    
User Draft:
Title: ${payload.currentTitle}
Description: ${payload.currentDescription}
Tags: ${payload.currentTags}

Competitor Video 1:
${JSON.stringify(payload.referenceVideos[0] || {}, null, 2)}

Competitor Video 2:
${JSON.stringify(payload.referenceVideos[1] || {}, null, 2)}

Task:
1. Analyze the user's draft against the competitors to find high-velocity keywords.
2. Rewrite the metadata to maximize Search Engine Optimization, CTR, and algorithmic reach.
3. Keep the title between 50-70 characters (CRITICAL for high score).
4. Expand the description to be extremely comprehensive (at least 350 words). Include a professional hook, detailed video summary, keyword-rich chapters/timestamps, and social media calls to action. High word count is REQUIRED for a professional SEO score.
5. Provide at least 25 highly relevant, comma-separated tags (max 500 characters total). 
6. Give a brief explanation of why these specific changes improve SEO performance.

IMPORTANT: Provide exactly ${titleVariations} title variation(s) and ${tagVariations} tag variation(s).
Output ONLY valid JSON matching this schema. Ensure all special characters are properly escaped and there is no text before or after the JSON block.
{
  "enhancedTitles": [string],
  "enhancedDescription": string,
  "enhancedTags": [string],
  "explanation": string
}`;

    try {
      const response = await this.client.chat.send({
        chatRequest: {
          model: DEFAULT_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        },
      });

      const text = this.extractText(response);
      if (!text) {
        throw new Error("Empty response from OpenRouter");
      }

      return this.extractJson(text);
    } catch (error) {
      console.error("OpenRouter SEO Enhancement Error:", error);
      throw error;
    }
  }

  /**
   * Robustly extracts and parses JSON from text.
   */
  private static extractJson(text: string) {
    try {
      // Find the first '{' and last '}'
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No JSON object found in response");
      }

      const cleanedText = text.substring(firstBrace, lastBrace + 1);
      
      // Attempt to fix common AI formatting errors like unescaped newlines in strings
      const sanitizedText = cleanedText.replace(/\n/g, '\\n').replace(/\r/g, '\\r');
      // Wait! If I replace all \n with \\n, it might break existing JSON structure.
      // Better to use a more surgical approach or just rely on the AI being better with lower temperature.
      
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON Parse Error. Raw text:", text);
      
      // One last try: strip control characters
      try {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        const cleanedText = text.substring(firstBrace, lastBrace + 1);
        const ultraCleaned = cleanedText.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");
        return JSON.parse(ultraCleaned);
      } catch (e) {
        throw new Error("Failed to parse AI response into valid JSON");
      }
    }
  }
}
