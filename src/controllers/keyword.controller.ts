import { Response } from 'express';
import { KeywordSuggestService } from '../services/keyword-suggest.service.js';
import { OpenRouterService } from '../services/openrouter.service.js';
import { deductCoins } from '../utils/coin.util.js';
import { checkLlmUsage } from '../utils/usage.util.js';

export class KeywordController {
  static async suggestKeywordsAndTitles(req: any, res: Response) {
    try {
      const { query } = req.body;
      const user = req.user;

      if (!query) {
        return res.status(400).json({ error: 'Core search query is required' });
      }

      // 1. Deduct 3 coins for AI keyword optimization
      const hasCoins = await deductCoins(user, 3);
      if (!hasCoins) {
        return res.status(402).json({
          error: {
            code: 'INSUFFICIENT_COINS',
            message: 'You need 3 coins to suggest AI-optimized titles. Watch a short ad to earn more!'
          }
        });
      }

      // 2. Enforce Daily Remote LLM Limit
      const usageCheck = await checkLlmUsage(user);
      if (!usageCheck.allowed) {
        return res.status(403).json({
          error: {
            code: 'DAILY_LIMIT_REACHED',
            message: usageCheck.message
          }
        });
      }

      // 3. Fetch autocomplete search suggestions from YouTube
      const suggestions = await KeywordSuggestService.fetchSuggestions(query);
      if (suggestions.length === 0) {
        return res.status(200).json({
          suggestions: [],
          suggestedTitles: [],
          strategyReasoning: 'No search suggestions were discovered for this keyword. Try a broader term!'
        });
      }

      // 4. Generate highly clickable titles via OpenRouter AI
      const aiResult = await OpenRouterService.generateSuggestedTitles(suggestions, query);

      return res.status(200).json({
        suggestions,
        suggestedTitles: aiResult.suggestedTitles || [],
        strategyReasoning: aiResult.strategyReasoning || ''
      });
    } catch (error: any) {
      console.error('[KeywordController] Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to suggest keywords and AI titles' });
    }
  }
}
