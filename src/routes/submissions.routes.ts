import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createSubmission,
  listSubmissions,
  getSubmission,
} from "../controllers/submissions.controller.js";

const router = Router();

router.post("/", authenticate, createSubmission);
router.get("/", authenticate, listSubmissions);
router.get("/:id", authenticate, getSubmission);

export default router;
