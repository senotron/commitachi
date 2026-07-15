import fs from "fs";
import path from "path";
import os from "os";

const DATA_DIR = path.join(os.homedir(), ".commitachi");
const STATE_FILE = path.join(DATA_DIR, "state.json");

const LEVEL_THRESHOLDS = [
  { level: 1, title: "Egg",            xpNeeded: 0 },
  { level: 2, title: "Hatchling",      xpNeeded: 50 },
  { level: 3, title: "Junior Dev",     xpNeeded: 150 },
  { level: 4, title: "Code Monkey",    xpNeeded: 400 },
  { level: 5, title: "Mid-Level",      xpNeeded: 800 },
  { level: 6, title: "Senior Dev",     xpNeeded: 1500 },
  { level: 7, title: "Architect",      xpNeeded: 3000 },
  { level: 8, title: "10x Engineer",   xpNeeded: 6000 },
  { level: 9, title: "Mass Maniac",    xpNeeded: 10000 },
  { level: 10, title: "Linus Torvalds", xpNeeded: 20000 },
];

function freshState() {
  return {
    name: "Commitachi",
    birthday: new Date().toISOString(),
    xp: 0,
    level: 1,
    title: "Egg",
    health: 100,
    hunger: 0,
    happiness: 80,
    totalCommits: 0,
    streak: 0,
    lastFedAt: null,
    lastCommitHash: null,
    badges: [],
    roastHistory: [],
    config: {
      geminiKey: null,
    },
  };
}

export function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadState() {
  ensureDataDir();
  if (!fs.existsSync(STATE_FILE)) {
    const s = freshState();
    saveState(s);
    return s;
  }
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return freshState();
  }
}

export function saveState(state) {
  ensureDataDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
}

// figure out current level from XP
export function recalcLevel(state) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (state.xp >= LEVEL_THRESHOLDS[i].xpNeeded) {
      state.level = LEVEL_THRESHOLDS[i].level;
      state.title = LEVEL_THRESHOLDS[i].title;
      break;
    }
  }
}

export function getNextLevelInfo(state) {
  const idx = LEVEL_THRESHOLDS.findIndex((t) => t.level === state.level);
  if (idx < LEVEL_THRESHOLDS.length - 1) {
    const next = LEVEL_THRESHOLDS[idx + 1];
    const current = LEVEL_THRESHOLDS[idx];
    const progress = ((state.xp - current.xpNeeded) / (next.xpNeeded - current.xpNeeded)) * 100;
    return { nextTitle: next.title, nextLevel: next.level, xpNeeded: next.xpNeeded, progress: Math.min(100, Math.max(0, progress)) };
  }
  return { nextTitle: null, nextLevel: null, xpNeeded: 0, progress: 100 };
}

// apply hunger/decay over time
export function applyDecay(state) {
  if (!state.lastFedAt) return;

  const now = Date.now();
  const lastFed = new Date(state.lastFedAt).getTime();
  const hoursSince = (now - lastFed) / (1000 * 60 * 60);

  // hunger grows ~4 points per hour, caps at 100
  state.hunger = Math.min(100, Math.round(state.hunger + hoursSince * 4));

  // health drops if starving
  if (state.hunger >= 80) {
    const penalty = Math.round((hoursSince - 20) * 2);
    state.health = Math.max(0, state.health - Math.max(0, penalty));
  }

  // happiness drifts down slowly
  state.happiness = Math.max(0, Math.round(state.happiness - hoursSince * 1.5));
}

const BADGE_DEFS = [
  { id: "first_bite",     name: "First Bite",      desc: "Fed your pet for the first time",           check: (s) => s.totalCommits >= 1 },
  { id: "ten_commits",    name: "Commit Warrior",   desc: "10 commits fed",                            check: (s) => s.totalCommits >= 10 },
  { id: "fifty_commits",  name: "Commit Machine",   desc: "50 commits — unstoppable",                  check: (s) => s.totalCommits >= 50 },
  { id: "centurion",      name: "Centurion",         desc: "100 commits. Legend.",                      check: (s) => s.totalCommits >= 100 },
  { id: "night_owl",      name: "Night Owl",         desc: "Committed after midnight",                  check: (s) => s._lastCommitHour >= 0 && s._lastCommitHour < 5 },
  { id: "early_bird",     name: "Early Bird",        desc: "Committed before 7 AM",                     check: (s) => s._lastCommitHour >= 5 && s._lastCommitHour < 7 },
  { id: "streak_3",       name: "Hot Streak",        desc: "3-day commit streak",                       check: (s) => s.streak >= 3 },
  { id: "streak_7",       name: "On Fire",           desc: "7-day commit streak 🔥",                   check: (s) => s.streak >= 7 },
  { id: "lvl5",           name: "Mid-Lifer",         desc: "Reached Mid-Level",                         check: (s) => s.level >= 5 },
  { id: "lvl8",           name: "10x Unlocked",      desc: "Reached 10x Engineer",                      check: (s) => s.level >= 8 },
];

export function checkBadges(state, commitHour) {
  const earned = [];
  state._lastCommitHour = commitHour;
  for (const badge of BADGE_DEFS) {
    if (!state.badges.includes(badge.id) && badge.check(state)) {
      state.badges.push(badge.id);
      earned.push(badge);
    }
  }
  delete state._lastCommitHour;
  return earned;
}

export function getAllBadgeDefs() {
  return BADGE_DEFS.map(({ id, name, desc }) => ({ id, name, desc }));
}

export { LEVEL_THRESHOLDS };
