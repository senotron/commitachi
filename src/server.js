import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import open from "open";
import { loadState, saveState, recalcLevel, applyDecay, getAllBadgeDefs, getNextLevelInfo, checkBadges } from "./state.js";
import { getLatestCommit, isGitRepo } from "./git.js";
import { generateRoast } from "./ai.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function startServer(port = 3727) {
  const app = express();
  app.use(express.json());

  // serve dashboard build
  const publicDir = path.join(__dirname, "..", "public");
  app.use(express.static(publicDir));

  // api routes
  app.get("/api/state", (_req, res) => {
    const state = loadState();
    applyDecay(state);
    recalcLevel(state);
    saveState(state);
    const next = getNextLevelInfo(state);
    res.json({ ...state, nextLevel: next });
  });

  app.get("/api/badges", (_req, res) => {
    const state = loadState();
    const allBadges = getAllBadgeDefs();
    const result = allBadges.map((b) => ({
      ...b,
      earned: state.badges.includes(b.id),
    }));
    res.json(result);
  });

  app.post("/api/feed", async (req, res) => {
    const cwd = req.body?.cwd || process.cwd();
    const state = loadState();
    applyDecay(state);

    if (!isGitRepo(cwd)) {
      return res.status(400).json({ error: "Not a git repository" });
    }

    const commit = getLatestCommit(cwd);
    if (!commit) {
      return res.status(400).json({ error: "No commits found" });
    }

    if (commit.hash === state.lastCommitHash) {
      return res.status(200).json({ alreadyFed: true, state });
    }

    const prevLevel = state.level;
    const xpGained = 10 + Math.floor(Math.random() * 15);
    state.xp += xpGained;
    state.totalCommits += 1;
    state.hunger = Math.max(0, state.hunger - 30);
    state.health = Math.min(100, state.health + 5);
    state.happiness = Math.min(100, state.happiness + 10);
    state.lastFedAt = new Date().toISOString();
    state.lastCommitHash = commit.hash;
    state.streak += 1;

    recalcLevel(state);
    const leveledUp = state.level > prevLevel;

    const commitHour = new Date(commit.date).getHours();
    const newBadges = checkBadges(state, commitHour);

    const apiKey = state.config.geminiKey || process.env.GEMINI_API_KEY || null;
    const roast = await generateRoast(commit, state, apiKey);

    state.roastHistory.push({
      text: roast,
      commit: commit.message.substring(0, 80),
      date: new Date().toISOString(),
    });

    if (state.roastHistory.length > 50) {
      state.roastHistory = state.roastHistory.slice(-50);
    }

    saveState(state);

    const next = getNextLevelInfo(state);
    res.json({
      alreadyFed: false,
      xpGained,
      leveledUp,
      newBadges,
      roast,
      commit,
      state: { ...state, nextLevel: next },
    });
  });

  app.post("/api/config", (req, res) => {
    const state = loadState();
    if (req.body.geminiKey !== undefined) {
      state.config.geminiKey = req.body.geminiKey || null;
    }
    saveState(state);
    res.json({ ok: true });
  });

  // SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  const server = app.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`\n  Commitachi dashboard running at ${url}\n`);
    open(url);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`\n  Commitachi dashboard is already running at http://localhost:${port}\n`);
      open(`http://localhost:${port}`);
      process.exit(0);
    } else {
      console.error("Server error:", err.message);
      process.exit(1);
    }
  });
}
