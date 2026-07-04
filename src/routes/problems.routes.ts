import { Router } from "express";
import { authenticate, checkAdmin } from "../middleware/auth.js";
import {
  listProblems,
  getProblem,
  createProblem,
  updateProblem,
  deleteProblem,
} from "../controllers/problems.controller.js";

const router = Router();

router.get("/", listProblems);
router.get("/:id", getProblem);
router.post("/", authenticate, checkAdmin, createProblem);
router.put("/:id", authenticate, checkAdmin, updateProblem);
router.delete("/:id", authenticate, checkAdmin, deleteProblem);

export default router;
