import { createYouTubeAgent } from "./langchain/agent.js";

/**
 * LangChainService orchestrating the modular DeepAgents workflow.
 */
export class LangChainService {

  /**
   * Helper to extract text content from various LangChain message formats.
   */
  private static extractTextContent(content: any): string {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .filter((part: any) => part.type === "text" && !part.thought)
        .map((part: any) => part.text)
        .join("");
    }
    return JSON.stringify(content);
  }

  /**
   * Robustly extracts and parses JSON from LLM output.
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

  /**
   * Generates high-performing YouTube metadata using a modular DeepAgent.
   */
  static async generateCreatorMetadata(promptPayload: any, user: any) {
    try {
      const isPremium = user?.plan === "PREMIUM";

      const counts = {
        titles: isPremium ? 10 : 4,
        tags: isPremium ? 15 : 4,
        hashtags: isPremium ? 12 : 4,
        ideas: isPremium ? 8 : 4,
        descType: isPremium ? "comprehensive, SEO-friendly" : "brief but SEO-optimized",
      };

      const agent = await createYouTubeAgent({
        systemPrompt: `
          You are a World-Class YouTube SEO and Growth Strategist.
          Goal: Generate high-performing metadata based on successful RECENT videos.
          Constraint: You must strictly return a valid JSON object.
        `,
      });

      const userTask = `
        Market Context (Successful Videos):
        ${JSON.stringify(promptPayload, null, 2)}

        Specific Tasks for this ${user?.plan || "FREE"} user:
        1. Title Ideas: Create ${counts.titles} ultra-clickable, SEO-optimized titles.
        2. Description Draft: Write a ${counts.descType} description.
        3. Tags: Provide ${counts.tags} high-volume, relevant tags.
        4. Hashtags: Provide ${counts.hashtags} relevant hashtags.
        5. Content Ideas: Provide ${counts.ideas} unique angles or video concepts.

        Formatting: Return ONLY a valid JSON object with keys: titleIdeas, descriptionDraft, tags, hashtags, ideas.
      `;

      const result = await agent.invoke({
        messages: [{ role: "user", content: userTask }],
      });

      const lastMessage = result.messages[result.messages.length - 1];
      const text = this.extractTextContent(lastMessage.content);
      return this.extractJson(text);
    } catch (error) {
      console.error("Creator Metadata AI Error:", error);
      throw error;
    }
  }
}
