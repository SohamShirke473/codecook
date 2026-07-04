import type { Request, Response } from "express";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { playlists, playlistProblems, problems } from "../db/schema/index.js";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
});

const updateSchema = createSchema.partial();

const addProblemSchema = z.object({
  problemId: z.string().uuid(),
});

export async function listPlaylists(req: Request, res: Response) {
  const rows = await db
    .select({
      id: playlists.id,
      name: playlists.name,
      description: playlists.description,
      problemCount: db.$count(
        playlistProblems,
        eq(playlistProblems.playlistId, playlists.id)
      ),
      createdAt: playlists.createdAt,
    })
    .from(playlists)
    .where(eq(playlists.userId, req.user!.id))
    .orderBy(desc(playlists.createdAt));

  res.json({ data: rows });
}

export async function getPlaylist(req: Request, res: Response) {
  const id = req.params.id as string;

  const [playlist] = await db
    .select()
    .from(playlists)
    .where(and(eq(playlists.id, id), eq(playlists.userId, req.user!.id)))
    .limit(1);

  if (!playlist) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }

  const prows = await db
    .select({
      id: problems.id,
      title: problems.title,
      difficulty: problems.difficulty,
      tags: problems.tags,
      addedAt: playlistProblems.addedAt,
    })
    .from(playlistProblems)
    .innerJoin(problems, eq(problems.id, playlistProblems.problemId))
    .where(eq(playlistProblems.playlistId, id))
    .orderBy(desc(playlistProblems.addedAt));

  res.json({ data: { ...playlist, problems: prows } });
}

export async function createPlaylist(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const [playlist] = await db
    .insert(playlists)
    .values({ userId: req.user!.id, ...parsed.data })
    .returning();

  res.status(201).json({ data: playlist });
}

export async function updatePlaylist(req: Request, res: Response) {
  const id = req.params.id as string;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const [playlist] = await db
    .update(playlists)
    .set(parsed.data)
    .where(and(eq(playlists.id, id), eq(playlists.userId, req.user!.id)))
    .returning();

  if (!playlist) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }

  res.json({ data: playlist });
}

export async function deletePlaylist(req: Request, res: Response) {
  const id = req.params.id as string;

  const [playlist] = await db
    .delete(playlists)
    .where(and(eq(playlists.id, id), eq(playlists.userId, req.user!.id)))
    .returning({ id: playlists.id });

  if (!playlist) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }

  res.json({ message: "Playlist deleted" });
}

export async function addProblemToPlaylist(req: Request, res: Response) {
  const playlistId = req.params.id as string;
  const parsed = addProblemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  const { problemId } = parsed.data;

  const [playlist] = await db
    .select({ id: playlists.id })
    .from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, req.user!.id)))
    .limit(1);

  if (!playlist) {
    res.status(404).json({ error: "Playlist not found" });
    return;
  }

  const [existing] = await db
    .select()
    .from(playlistProblems)
    .where(
      and(
        eq(playlistProblems.playlistId, playlistId),
        eq(playlistProblems.problemId, problemId)
      )
    )
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "Problem already in playlist" });
    return;
  }

  await db.insert(playlistProblems).values({ playlistId, problemId });

  res.status(201).json({ message: "Problem added to playlist" });
}

export async function removeProblemFromPlaylist(req: Request, res: Response) {
  const playlistId = req.params.id as string;
  const problemId = req.params.problemId as string;

  const [deleted] = await db
    .delete(playlistProblems)
    .where(
      and(
        eq(playlistProblems.playlistId, playlistId),
        eq(playlistProblems.problemId, problemId)
      )
    )
    .returning({ playlistId: playlistProblems.playlistId });

  if (!deleted) {
    res.status(404).json({ error: "Problem not found in playlist" });
    return;
  }

  res.json({ message: "Problem removed from playlist" });
}
