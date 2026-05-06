import { Router } from "express";
import { addCoins, dailyLogin } from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/add-coins", authMiddleware, addCoins);
router.post("/daily-login", authMiddleware, dailyLogin);

export default router;
