import { createDeepAgent } from "deepagents";
import { getPrimaryModel } from "./model.js";
import { tools } from "./tools.js";

/**
 * Configuration for the DeepAgent
 */
export interface AgentOptions {
  systemPrompt?: string;
}

/**
 * Factory function to create a configured DeepAgent
 */
export const createYouTubeAgent = async (options: AgentOptions = {}) => {
  const model = await getPrimaryModel();
  
  return createDeepAgent({
    model,
    tools,
    systemPrompt: options.systemPrompt || "You are a helpful YouTube Creator Assistant.",
  });
};
