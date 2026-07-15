#!/usr/bin/env node

import pc from "picocolors";
import dotenv from "dotenv";
import { loadState, saveState, recalcLevel, getNextLevelInfo, applyDecay, checkBadges } from "../src/state.js";
import { getLatestCommit, isGitRepo } from "../src/git.js";
import { generateRoast } from "../src/ai.js";
import { getSprite, getEatingSprite, getEvolvedSprite } from "../src/ascii.js";

dotenv.config();

const args = process.argv.slice(2);
const command = args[0] || "show";

async function main() {
  const state = loadState();
  applyDecay(state);
  recalcLevel(state);

  switch (command) {
    case "feed":
      await handleFeed(state);
      break;
    case "status":
      handleStatus(state);
      break;
    case "web":
      await handleWeb();
      break;
    case "config":
      handleConfig(state, args.slice(1));
      break;
    case "show":
    default:
      handleShow(state);
      break;
  }
}

function handleShow(state) {
  const sprite = getSprite(state);
  console.log("");
  console.log(pc.cyan(pc.bold(`  ── Commitachi ──`)));
  console.log(pc.yellow(sprite));
  console.log(`  ${pc.bold(state.name)} ${pc.dim(`(Lv.${state.level} ${state.title})`)}`);
  console.log("");

  const bar = (label, value, color) => {
    const filled = Math.round(value / 5);
    const empty = 20 - filled;
    const c = color === "green" ? pc.green : color === "red" ? pc.red : pc.yellow;
    console.log(`  ${label.padEnd(12)} ${c("█".repeat(filled))}${pc.dim("░".repeat(empty))} ${value}%`);
  };

  bar("Health", state.health, state.health > 50 ? "green" : "red");
  bar("Hunger", state.hunger, state.hunger < 50 ? "green" : "red");
  bar("Happiness", state.happiness, state.happiness > 40 ? "green" : "yellow");

  const nxt = getNextLevelInfo(state);
  if (nxt.nextTitle) {
    bar(`→ ${nxt.nextTitle}`, Math.round(nxt.progress), "yellow");
  }

  console.log("");
  console.log(`  ${pc.dim("Commits:")} ${state.totalCommits}  ${pc.dim("Streak:")} ${state.streak} days  ${pc.dim("XP:")} ${state.xp}`);

  if (state.badges.length > 0) {
    console.log(`  ${pc.dim("Badges:")} ${state.badges.map(b => pc.magenta(b)).join(", ")}`);
  }

  if (state.hunger >= 80) {
    console.log("");
    console.log(pc.red(pc.bold("  ⚠ Your pet is starving! Run: commitachi feed")));
  }

  if (state.roastHistory.length > 0) {
    const last = state.roastHistory[state.roastHistory.length - 1];
    console.log("");
    console.log(pc.dim(`  Last roast: "${last.text}"`));
  }

  console.log("");
  saveState(state);
}

async function handleFeed(state) {
  const cwd = process.cwd();

  if (!isGitRepo(cwd)) {
    console.log(pc.red("\n  Not a git repository. cd into a project with git history first.\n"));
    process.exit(1);
  }

  const commit = getLatestCommit(cwd);
  if (!commit) {
    console.log(pc.red("\n  No commits found in this repo.\n"));
    process.exit(1);
  }

  if (commit.hash === state.lastCommitHash) {
    console.log(pc.yellow("\n  Already fed this commit. Make a new one first!\n"));
    handleShow(state);
    return;
  }

  // feed the pet
  const prevLevel = state.level;
  const xpGained = 10 + Math.floor(Math.random() * 15);
  state.xp += xpGained;
  state.totalCommits += 1;
  state.hunger = Math.max(0, state.hunger - 30);
  state.health = Math.min(100, state.health + 5);
  state.happiness = Math.min(100, state.happiness + 10);
  state.lastFedAt = new Date().toISOString();
  state.lastCommitHash = commit.hash;

  // streak logic
  if (state.lastFedAt) {
    const lastDate = new Date(state.lastFedAt).toDateString();
    const today = new Date().toDateString();
    if (lastDate !== today) {
      state.streak += 1;
    }
  } else {
    state.streak = 1;
  }

  recalcLevel(state);

  // show eating animation
  console.log(pc.green(getEatingSprite()));
  console.log(pc.green(pc.bold(`  +${xpGained} XP`)) + pc.dim(` (total: ${state.xp})`));
  console.log(pc.dim(`  Commit: ${commit.message.substring(0, 60)}`));

  // level up?
  if (state.level > prevLevel) {
    console.log(pc.cyan(getEvolvedSprite()));
    console.log(pc.cyan(pc.bold(`  ★ EVOLVED to Lv.${state.level} — ${state.title}! ★`)));
    console.log("");
  }

  // badges
  const commitHour = new Date(commit.date).getHours();
  const newBadges = checkBadges(state, commitHour);
  for (const b of newBadges) {
    console.log(pc.magenta(`  🏅 New badge: ${b.name} — ${b.desc}`));
  }

  // generate roast
  const apiKey = state.config.geminiKey || process.env.GEMINI_API_KEY || null;
  console.log(pc.dim("\n  Generating reaction..."));

  const roast = await generateRoast(commit, state, apiKey);
  console.log(`\n  ${pc.yellow(pc.bold("Commitachi:"))} ${pc.italic(roast)}\n`);

  state.roastHistory.push({
    text: roast,
    commit: commit.message.substring(0, 80),
    date: new Date().toISOString(),
  });

  // keep only last 50 roasts
  if (state.roastHistory.length > 50) {
    state.roastHistory = state.roastHistory.slice(-50);
  }

  saveState(state);
}

function handleStatus(state) {
  console.log("");
  console.log(pc.cyan(pc.bold("  ╔══════════════════════════════════╗")));
  console.log(pc.cyan(pc.bold("  ║     COMMITACHI STATUS REPORT     ║")));
  console.log(pc.cyan(pc.bold("  ╚══════════════════════════════════╝")));
  console.log("");
  console.log(`  ${pc.bold("Name:")}          ${state.name}`);
  console.log(`  ${pc.bold("Birthday:")}      ${new Date(state.birthday).toLocaleDateString()}`);
  console.log(`  ${pc.bold("Level:")}         ${state.level} (${state.title})`);
  console.log(`  ${pc.bold("XP:")}            ${state.xp}`);
  console.log(`  ${pc.bold("Health:")}         ${state.health}%`);
  console.log(`  ${pc.bold("Hunger:")}         ${state.hunger}%`);
  console.log(`  ${pc.bold("Happiness:")}      ${state.happiness}%`);
  console.log(`  ${pc.bold("Total Commits:")}  ${state.totalCommits}`);
  console.log(`  ${pc.bold("Streak:")}         ${state.streak} days`);
  console.log("");

  if (state.badges.length > 0) {
    console.log(pc.bold("  Badges Earned:"));
    for (const b of state.badges) {
      console.log(`    ${pc.magenta("●")} ${b}`);
    }
  } else {
    console.log(pc.dim("  No badges yet. Start committing!"));
  }

  console.log("");

  if (state.roastHistory.length > 0) {
    console.log(pc.bold("  Recent Roasts:"));
    const recent = state.roastHistory.slice(-5);
    for (const r of recent) {
      console.log(`    ${pc.dim(new Date(r.date).toLocaleString())} — ${pc.italic(r.text)}`);
    }
  }

  console.log("");
  saveState(state);
}

async function handleWeb() {
  const { startServer } = await import("../src/server.js");
  await startServer();
}

function handleConfig(state, configArgs) {
  if (configArgs.length === 0) {
    console.log(`\n  ${pc.bold("Current config:")}`);
    console.log(`  Gemini API Key: ${state.config.geminiKey ? pc.green("set") : pc.red("not set")}`);
    console.log(`\n  Usage: commitachi config key <your-gemini-api-key>\n`);
    return;
  }
  if (configArgs[0] === "key" && configArgs[1]) {
    state.config.geminiKey = configArgs[1];
    saveState(state);
    console.log(pc.green("\n  Gemini API key saved.\n"));
  }
}

main().catch((err) => {
  console.error(pc.red("Error:"), err.message);
  process.exit(1);
});
