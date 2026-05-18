import { Response } from 'express';
import { PostScraperService } from '../services/post-scraper.service.js';
import { deductCoins } from '../utils/coin.util.js';

export class PostController {
  static async getPostImages(req: any, res: Response) {
    try {
      const user = req.user;
      const { postUrl } = req.body;

      if (!postUrl || typeof postUrl !== 'string') {
        return res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Please provide a valid YouTube community post URL.'
          }
        });
      }

      // 1. Deduct 2 coins for parsing community post attachments
      const hasCoins = await deductCoins(user, 2);
      if (!hasCoins) {
        return res.status(402).json({
          error: {
            code: 'INSUFFICIENT_COINS',
            message: 'You need 2 coins to download community post images. Watch a short ad to earn more!'
          }
        });
      }

      // 2. Fetch and parse post details
      const result = await PostScraperService.fetchPostImages(postUrl);

      return res.status(200).json(result);
    } catch (error: any) {
      console.error('[PostController] Error:', error);
      return res.status(500).json({
        error: {
          code: 'SCRAPE_FAILED',
          message: error.message || 'Failed to fetch community post images'
        }
      });
    }
  }
}
