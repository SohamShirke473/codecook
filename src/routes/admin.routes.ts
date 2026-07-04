import { Router } from "express";
import { authenticate, checkAdmin } from "../middleware/auth.js";
import { stats, listUsers } from "../controllers/admin.controller.js";

const router = Router();

router.use(authenticate, checkAdmin);

router.get("/stats", stats);
router.get("/users", listUsers);

export default router;
