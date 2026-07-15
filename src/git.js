import { execSync } from "child_process";

export function getLatestCommit(cwd) {
  try {
    const raw = execSync(
      'git log -1 --pretty=format:"%H|||%s|||%an|||%aI"',
      { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim();

    if (!raw) return null;

    const [hash, message, author, date] = raw.replace(/^"|"$/g, "").split("|||");
    return { hash, message, author, date };
  } catch {
    return null;
  }
}

export function getTotalCommitCount(cwd) {
  try {
    const count = execSync("git rev-list --count HEAD", {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return parseInt(count, 10) || 0;
  } catch {
    return 0;
  }
}

export function isGitRepo(cwd) {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}
