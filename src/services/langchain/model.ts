import { ChatGoogle } from "@langchain/google";
import { config } from "../../config/index.js";

/**
 * Initializes the primary AI model using @langchain/google.
 */
export const getPrimaryModel = async () => {
  return new ChatGoogle({
    model: "gemma-4-26b-a4b-it",
    apiKey: config.googleAiApiKey,
    temperature: 0.7,
  });
};
