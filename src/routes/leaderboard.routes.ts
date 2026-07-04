import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { leaderboard, myRank } from "../controllers/leaderboard.controller.js";

const router = Router();

router.get("/", leaderboard);
router.get("/me", authenticate, myRank);

export default router;
