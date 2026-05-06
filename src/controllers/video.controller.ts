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

      // Enforce per-plan video URL limits (server-side, cannot be bypassed)
      const isPremium = user?.plan === 'PREMIUM';
      const maxVideos = isPremium ? 10 : 3;
      const videoList = Array.isArray(payload.videos) ? payload.videos : [];
      if (videoList.length > maxVideos) {
        return res.status(403).json({
          error: {
            code: 'LIMIT_EXCEEDED',
            message: `${isPremium ? 'Premium' : 'Free'} users can load up to ${maxVideos} videos. Upgrade to Premium for 10 videos.`
          }
        });
      }

      // Deduct 10 coins for AI metadata generation
      const hasCoins = await deductCoins(user, 10);
      if (!hasCoins) {
        return res.status(402).json({
          error: {
            code: 'INSUFFICIENT_COINS',
            message: 'You need 10 coins for AI generation. Watch a short ad to earn more!'
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

      if (!payload) {
        return res.status(400).json({ error: 'Payload is required' });
      }

      // Enforce per-plan video count limits
      const isPremium = user?.plan === 'PREMIUM';
      const maxVideos = isPremium ? 15 : 5;
      if (Array.isArray(payload.videos) && payload.videos.length > maxVideos) {
        payload.videos = payload.videos.slice(0, maxVideos);
      }

      // Deduct 10 coins for trend analysis (available to all users)
      const hasCoins = await deductCoins(user, 10);
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

      if (!payload) {
        return res.status(400).json({ error: 'Payload is required' });
      }

      // Enforce per-plan video count limits
      const isPremium = user?.plan === 'PREMIUM';
      const maxVideos = isPremium ? 10 : 5;
      if (Array.isArray(payload.videos) && payload.videos.length > maxVideos) {
        payload.videos = payload.videos.slice(0, maxVideos);
      }

      // Deduct 10 coins for competitor analysis (available to all users)
      const hasCoins = await deductCoins(user, 10);
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

      // Deduct 10 coins for heavy comparison analysis
      const hasCoins = await deductCoins(user, 10);
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

  static async enhanceSeo(req: any, res: Response) {
    try {
      const { payload } = req.body;
      const user = (req as any).user || req.body.user;

      if (!payload) {
        return res.status(400).json({ error: 'Payload is required' });
      }

      // Deduct 10 coins for SEO enhancement
      const hasCoins = await deductCoins(user, 10);
      if (!hasCoins) {
        return res.status(402).json({
          error: {
            code: 'INSUFFICIENT_COINS',
            message: 'You do not have enough coins. Watch a short ad to earn more!'
          }
        });
      }

      const result = await OpenRouterService.enhanceSeo(payload, user);
      res.status(200).json(result);
    } catch (error) {
      console.error('SEO Enhance Controller Error:', error);
      res.status(500).json({ error: 'Failed to enhance SEO metadata' });
    }
  }

  /**
   * Deducts 3 coins for lightweight YouTube fetch actions (Fetch References, Load Trends, Competitor Search).
   * No LLM involved — charges for YouTube Data API quota usage.
   */
  static async logFetchCost(req: any, res: Response) {
    try {
      const user = req.user;
      console.log('Log Fetch Cost - User ID:', user?.$id);

      if (!user) {
        console.error('Log Fetch Cost - No User in Request');
        return res.status(401).json({ 
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' } 
        });
      }

      const hasCoins = await deductCoins(user, 3);
      if (!hasCoins) {
        return res.status(402).json({
          error: {
            code: 'INSUFFICIENT_COINS',
            message: 'You need 3 coins for this action. Earn more by watching a short ad!'
          }
        });
      }
      res.status(200).json({ success: true, cost: 3 });
    } catch (error) {
      console.error('Log Fetch Cost Error:', error);
      res.status(500).json({ 
        error: { code: 'INTERNAL_ERROR', message: 'Failed to log fetch cost' } 
      });
    }
  }

  /**
   * Deducts 2 coins for lightweight YouTube search actions (Trend Explorer search).
   */
  static async logSearchCost(req: any, res: Response) {
    try {
      const user = req.user;
      console.log('Log Search Cost - User ID:', user?.$id);

      if (!user) {
        console.error('Log Search Cost - No User in Request');
        return res.status(401).json({ 
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' } 
        });
      }

      const hasCoins = await deductCoins(user, 2);
      if (!hasCoins) {
        return res.status(402).json({
          error: {
            code: 'INSUFFICIENT_COINS',
            message: 'You need 2 coins to search. Earn more by watching a short ad!'
          }
        });
      }
      res.status(200).json({ success: true, cost: 2 });
    } catch (error) {
      console.error('Log Search Cost Error:', error);
      res.status(500).json({ 
        error: { code: 'INTERNAL_ERROR', message: 'Failed to log search cost' } 
      });
    }
  }

  /**
   * Deducts 10 coins for heavy analytical actions (Metadata analysis).
   */
  static async logHeavyActionCost(req: any, res: Response) {
    try {
      const user = req.user;
      console.log('Log Heavy Action Cost - User ID:', user?.$id);

      if (!user) {
        return res.status(401).json({ 
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' } 
        });
      }

      const hasCoins = await deductCoins(user, 10);
      if (!hasCoins) {
        return res.status(402).json({
          error: {
            code: 'INSUFFICIENT_COINS',
            message: 'You need 10 coins for this analysis. Earn more by watching a short ad!'
          }
        });
      }
      res.status(200).json({ success: true, cost: 10 });
    } catch (error) {
      console.error('Log Heavy Action Cost Error:', error);
      res.status(500).json({ 
        error: { code: 'INTERNAL_ERROR', message: 'Failed to log action cost' } 
      });
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
