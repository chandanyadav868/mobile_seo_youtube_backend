import { Router } from 'express';
import { VideoController } from '../controllers/video.controller.js';
import { ChannelController } from '../controllers/channel.controller.js';
import { KeywordController } from '../controllers/keyword.controller.js';
import { SearchController } from '../controllers/search.controller.js';
import { PostController } from '../controllers/post.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/videos/generate-metadata
// Protected by authMiddleware
router.post('/generate-metadata', authMiddleware, VideoController.generateMetadata);

// POST /api/videos/generate-report
// Protected by authMiddleware
router.post('/generate-report', authMiddleware, VideoController.generateTrendingReport);

// POST /api/videos/generate-competitor
// Protected by authMiddleware
router.post('/generate-competitor', authMiddleware, VideoController.generateCompetitorAnalysis);

// POST /api/videos/generate-comparison
// Protected by authMiddleware
router.post('/generate-comparison', authMiddleware, VideoController.generateVideoComparison);

// POST /api/videos/enhance-seo
// Protected by authMiddleware
router.post('/enhance-seo', authMiddleware, VideoController.enhanceSeo);

// POST /api/videos/log-fetch-cost — deducts 3 coins for YouTube fetch actions
router.post('/log-fetch-cost', authMiddleware, VideoController.logFetchCost);

// POST /api/videos/log-llm-cost — deducts 3 coins for local LLM completions without checking YouTube daily limits
router.post('/log-llm-cost', authMiddleware, VideoController.logLlmCost);

// POST /api/videos/log-search-cost — deducts 2 coins for YouTube search actions
router.post('/log-search-cost', authMiddleware, VideoController.logSearchCost);

// POST /api/videos/log-heavy-cost — deducts 10 coins for intensive analysis
router.post('/log-heavy-cost', authMiddleware, VideoController.logHeavyActionCost);

// GET /api/videos/channels/:handle/videos — Channel Spy Pro
router.get('/channels/:handle/videos', authMiddleware, ChannelController.spyChannel);

// POST /api/videos/keywords/suggest — AI Title Suggest Pro
router.post('/keywords/suggest', authMiddleware, KeywordController.suggestKeywordsAndTitles);

// GET /api/videos/search/spy — Keyword Rank Spy
router.get('/search/spy', authMiddleware, SearchController.spySearchRankings);

// POST /api/videos/post/images — HD Community Post Image Downloader
router.post('/post/images', authMiddleware, PostController.getPostImages);

// GET /api/videos/:videoId/transcript
// Protected by authMiddleware
router.get('/:videoId/transcript', authMiddleware, VideoController.getVideoTranscript);

// GET /api/videos/:videoId/metadata
// Protected by authMiddleware
router.get('/:videoId/metadata', authMiddleware, VideoController.getVideoScrapedMetadata);

// GET /api/videos/:videoId
router.get('/:videoId', VideoController.getVideoDetails);

export default router;
