import { Router } from "express";
import { addCoins, dailyLogin, resetLlmLimits } from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/add-coins", authMiddleware, addCoins);
router.post("/daily-login", authMiddleware, dailyLogin);
router.post("/reset-llm-limits", resetLlmLimits);

export default router;
