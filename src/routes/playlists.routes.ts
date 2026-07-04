import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  listPlaylists,
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addProblemToPlaylist,
  removeProblemFromPlaylist,
} from "../controllers/playlists.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", listPlaylists);
router.get("/:id", getPlaylist);
router.post("/", createPlaylist);
router.put("/:id", updatePlaylist);
router.delete("/:id", deletePlaylist);
router.post("/:id/problems", addProblemToPlaylist);
router.delete("/:id/problems/:problemId", removeProblemFromPlaylist);

export default router;
