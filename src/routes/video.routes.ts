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

// GET /api/videos/:videoId
router.get('/:videoId', VideoController.getVideoDetails);

export default router;
