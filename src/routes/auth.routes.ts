import { Router } from "express";
import { register, login, logout, refresh, checkAuth } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/check", authenticate, checkAuth);

export default router;
