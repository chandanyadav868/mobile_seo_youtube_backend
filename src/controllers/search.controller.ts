import { Response } from 'express';
import { SearchSpyService } from '../services/search-spy.service.js';
import { deductCoins } from '../utils/coin.util.js';

export class SearchController {
  static async spySearchRankings(req: any, res: Response) {
    try {
      const { query } = req.query;
      const user = req.user;

      const cleanedQuery = (query || '').trim();
      if (!cleanedQuery) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      // 1. Deduct 4 coins for keyword search rank spy
      const hasCoins = await deductCoins(user, 4);
      if (!hasCoins) {
        return res.status(402).json({
          error: {
            code: 'INSUFFICIENT_COINS',
            message: 'You need 4 coins to run keyword search spying. Watch a short ad to earn more!'
          }
        });
      }

      const videos = await SearchSpyService.spyKeywordSearch(cleanedQuery);
      if (videos.length === 0) {
        return res.status(200).json({
          videos: [],
          stats: {
            averageViews: 0,
            averageTitleLength: 0,
            difficultyScore: 10,
            commonKeywords: []
          }
        });
      }

      // 2. Compute organic page 1 stats
      let totalViews = 0;
      let totalTitleLength = 0;
      const wordCounts: { [key: string]: number } = {};
      const stopWords = new Set([
        'the', 'and', 'a', 'to', 'of', 'in', 'is', 'you', 'that', 'it', 'he', 'was', 
        'for', 'on', 'are', 'as', 'with', 'his', 'they', 'i', 'at', 'be', 'this', 
        'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 
        'all', 'were', 'we', 'when', 'your', 'can', 'said', 'there', 'use', 'an', 
        'each', 'which', 'she', 'do', 'how', 'their', 'if', 'vs', '|', '-', '&', 
        'new', 'official', 'video', 'music', 'trailer', 'teaser', 'game', 'play'
      ]);

      for (const video of videos) {
        totalViews += video.views;
        totalTitleLength += video.title.length;

        // Count keyword repetitions
        const words = video.title.toLowerCase().split(/\s+/);
        for (const w of words) {
          const cleaned = w.replace(/[^a-zA-Z0-9]/g, '');
          if (cleaned && cleaned.length > 2 && !stopWords.has(cleaned)) {
            wordCounts[cleaned] = (wordCounts[cleaned] || 0) + 1;
          }
        }
      }

      const count = videos.length;
      const averageViews = Math.round(totalViews / count);
      const averageTitleLength = Math.round(totalTitleLength / count);

      // Compute difficulty score dynamically based on average views
      let difficultyScore = 25;
      if (averageViews > 1.5e6) {
        difficultyScore = 88;
      } else if (averageViews > 7.5e5) {
        difficultyScore = 75;
      } else if (averageViews > 3e5) {
        difficultyScore = 60;
      } else if (averageViews > 1e5) {
        difficultyScore = 48;
      } else if (averageViews > 3e4) {
        difficultyScore = 35;
      }

      const commonKeywords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([text, value]) => ({ text, count: value }));

      return res.status(200).json({
        videos,
        stats: {
          averageViews,
          averageTitleLength,
          difficultyScore,
          commonKeywords
        }
      });
    } catch (error: any) {
      console.error('[SearchController] Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to spy on search keyword rankings' });
    }
  }
}
