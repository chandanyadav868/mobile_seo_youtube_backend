import * as z from "zod";
import { tool } from "@langchain/core/tools";

/**
 * Example Tool: Weather Fetcher
 */
export const getWeather = tool(
  async ({ city }) => {
    // In a real app, this would call a weather API
    return `It's currently 22°C and clear in ${city}.`;
  },
  {
    name: "get_weather",
    description: "Get the current weather for a given city",
    schema: z.object({
      city: z.string().describe("The name of the city to check weather for"),
    }),
  }
);

/**
 * YouTube Specific Tool: Video Analyzer (Placeholder)
 */
export const videoAnalyzer = tool(
  async ({ videoId }) => {
    return `Analysis for video ${videoId}: Highly engaging content, strong retention in the first 30 seconds.`;
  },
  {
    name: "analyze_video_performance",
    description: "Analyze the performance metrics of a specific YouTube video",
    schema: z.object({
      videoId: z.string().describe("The unique ID of the YouTube video"),
    }),
  }
);

// Export all tools as a collection
export const tools = [getWeather, videoAnalyzer];
