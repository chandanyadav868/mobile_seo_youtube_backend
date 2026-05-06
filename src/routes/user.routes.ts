import { Router } from "express";
import { addCoins } from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/add-coins", authMiddleware, addCoins);

export default router;
