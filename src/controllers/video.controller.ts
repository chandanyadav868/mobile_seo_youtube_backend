import { Request, Response } from 'express';
import { LangChainService } from '../services/langchain.service.js';
import { OpenRouterService } from '../services/openrouter.service.js';
import { deductCoins } from '../utils/coin.util.js';

export class VideoController {
  static async generateMetadata(req: any, res: Response) {
    try {
      const { payload } = req.body;
      const user = (req as any).user || req.body.user;

      if (!payload) {
        return res.status(400).json({ error: 'Payload is required' });
      }

      // Deduct 3 coins for lightweight metadata generation
      const hasCoins = await deductCoins(user, 3);
      if (!hasCoins) {
        return res.status(402).json({
          error: {
            code: 'INSUFFICIENT_COINS',
            message: 'You do not have enough coins. Watch a short ad to earn more!'
          }
        });
      }

      const result = await LangChainService.generateCreatorMetadata(payload, user);
      res.status(200).json(result);
    } catch (error) {
      console.error('Controller Error:', error);
      res.status(500).json({ error: 'Failed to generate metadata' });
    }
  }

  static async generateTrendingReport(req: any, res: Response) {
    try {
      const { payload } = req.body;
      const user = (req as any).user || req.body.user;

      // Premium Gating: Only Premium users can generate strategy reports
      if (user?.plan !== 'PREMIUM') {
        return res.status(403).json({
          error: {
            code: 'PREMIUM_REQUIRED',
            message: 'Trend strategy reports are a Premium feature.'
          }
        });
      }

      if (!payload) {
        return res.status(400).json({ error: 'Payload is required' });
      }

      // Deduct 8 coins for heavy deep-dive analysis
      const hasCoins = await deductCoins(user, 8);
      if (!hasCoins) {
        return res.status(402).json({
          error: {
            code: 'INSUFFICIENT_COINS',
            message: 'You do not have enough coins. Watch a short ad to earn more!'
          }
        });
      }

      const result = await OpenRouterService.generateTrendingReport(payload, user);
      res.status(200).json(result);
    } catch (error) {
      console.error('Trending Report Controller Error:', error);
      res.status(500).json({ error: 'Failed to generate trending report' });
    }
  }

  static async generateCompetitorAnalysis(req: any, res: Response) {
    try {
      const { payload } = req.body;
      const user = (req as any).user || req.body.user;

      // Premium Gating: Only Premium users can generate competitor research
      if (user?.plan !== 'PREMIUM') {
        return res.status(403).json({
          error: {
            code: 'PREMIUM_REQUIRED',
            message: 'Competitor analysis is a Premium feature.'
          }
        });
      }

      if (!payload) {
        return res.status(400).json({ error: 'Payload is required' });
      }

      // Deduct 8 coins for heavy competitor analysis
      const hasCoins = await deductCoins(user, 8);
      if (!hasCoins) {
        return res.status(402).json({
          error: {
            code: 'INSUFFICIENT_COINS',
            message: 'You do not have enough coins. Watch a short ad to earn more!'
          }
        });
      }

      const result = await OpenRouterService.generateCompetitorAnalysis(payload, user);
      res.status(200).json(result);
    } catch (error) {
      console.error('Competitor Analysis Controller Error:', error);
      res.status(500).json({ error: 'Failed to generate competitor analysis' });
    }
  }

  static async generateVideoComparison(req: any, res: Response) {
    try {
      const { payload } = req.body;
      const user = (req as any).user || req.body.user;

      const isPremium = user?.plan === 'PREMIUM';
      const maxLimit = isPremium ? 5 : 2;

      if (!payload || !Array.isArray(payload)) {
        return res.status(400).json({ error: 'Payload must be an array of videos' });
      }

      if (payload.length > maxLimit) {
        return res.status(403).json({
          error: {
            code: 'LIMIT_EXCEEDED',
            message: `${isPremium ? 'Premium' : 'Free'} users can compare up to ${maxLimit} videos.`
          }
        });
      }

      if (!payload) {
        return res.status(400).json({ error: 'Payload is required' });
      }

      // Deduct 8 coins for heavy comparison analysis
      const hasCoins = await deductCoins(user, 8);
      if (!hasCoins) {
        return res.status(402).json({
          error: {
            code: 'INSUFFICIENT_COINS',
            message: 'You do not have enough coins. Watch a short ad to earn more!'
          }
        });
      }

      const result = await OpenRouterService.generateVideoComparison(payload, user);
      res.status(200).json(result);
    } catch (error) {
      console.error('Comparison Controller Error:', error);
      res.status(500).json({ error: 'Failed to generate comparison analysis' });
    }
  }

  static async getVideoDetails(req: Request, res: Response) {
    // This will be expanded to call YouTube API service later
    const { videoId } = req.params;
    res.status(200).json({
      id: videoId,
      title: 'Sample Video',
      description: 'Fetched from backend',
      mocked: true
    });
  }
}
