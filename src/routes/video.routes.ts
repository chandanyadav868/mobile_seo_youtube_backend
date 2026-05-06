import { Router } from 'express';
import { VideoController } from '../controllers/video.controller.js';
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

// GET /api/videos/:videoId
router.get('/:videoId', VideoController.getVideoDetails);

export default router;
