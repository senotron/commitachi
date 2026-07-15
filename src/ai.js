import { GoogleGenerativeAI } from "@google/generative-ai";

const OFFLINE_ROASTS = [
  "Ah yes, another commit message that tells me absolutely nothing. Future you will love this.",
  "You committed at THIS hour? Your code has the same energy as a gas station sushi.",
  "'Fixed stuff' — truly the Shakespeare of commit messages.",
  "I see you're still using console.log for debugging. Bold strategy.",
  "That commit was so small, even my hunger bar didn't move.",
  "Wow, you actually wrote tests? Just kidding, I know you didn't.",
  "Your commit history reads like a cry for help.",
  "I've seen cleaner diffs in a food fight.",
  "Another day, another mass push of untested code. Classic you.",
  "This commit message has the same vibe as 'I'll refactor later'. We both know you won't.",
  "You force-pushed to main? I'm not mad, just disappointed.",
  "I'd roast your code, but it seems like it's already on fire.",
  "Congrats on the commit! Your pet is fed, but your code quality is still starving.",
  "Your variable naming convention appears to be 'keyboard smash'. Interesting choice.",
  "That function is longer than my entire lifespan. Please refactor me out of this misery.",
  "README.md updated — the only documentation you'll ever write, apparently.",
  "You deleted more lines than you added. Honestly? Respect.",
  "Is that a nested ternary inside a nested ternary? I need therapy.",
  "Your git blame looks like a crime scene report.",
  "Package-lock changed but nothing else? Ah, the classic 'I swear I did something' commit.",
];

const PRAISE_LINES = [
  "Okay not bad, not bad at all. I'll allow it.",
  "A clean commit with a proper message? Who are you and what did you do with my owner?",
  "Finally, some quality commits. I'm actually full for once.",
  "That was... actually good code. Don't let it go to your head.",
  "Streak day unlocked. Maybe you ARE a real developer after all.",
];

export async function generateRoast(commit, state, apiKey) {
  if (!apiKey) {
    return pickOffline(commit);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = buildPrompt(commit, state);
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    if (text.length > 10) return text;
    return pickOffline(commit);
  } catch {
    return pickOffline(commit);
  }
}

function buildPrompt(commit, state) {
  return `You are a sarcastic, witty virtual pet living in a developer's terminal. Your name is Commitachi. You just got fed with a git commit. React to it in 1-2 short sentences. Be funny, snarky, and brutally honest but never mean-spirited. Mix developer humor with pet personality.

Commit message: "${commit.message}"
Author: ${commit.author}
Time: ${commit.date}
Pet hunger level: ${state.hunger}%
Pet level: ${state.level} (${state.title})
Total commits eaten: ${state.totalCommits}
Streak days: ${state.streak}

Rules:
- Keep it under 180 characters
- No hashtags, no emojis overload (1 emoji max)
- Sound natural, like a grumpy but lovable pet
- Reference the commit message content when possible
- If the commit message is lazy (like "fix", "update", "wip"), roast them harder`;
}

function pickOffline(commit) {
  const msg = (commit?.message || "").toLowerCase();

  // extra harsh for lazy messages
  if (msg === "fix" || msg === "update" || msg === "wip" || msg.length < 5) {
    const lazy = [
      `"${commit.message}" — wow, really going all out on the documentation today.`,
      `Commit message: "${commit.message}". I've seen more effort from a screen saver.`,
      `"${commit.message}"? That's not a commit message, that's a cry for code review.`,
    ];
    return lazy[Math.floor(Math.random() * lazy.length)];
  }

  // small chance of praise to keep it interesting
  if (Math.random() < 0.15) {
    return PRAISE_LINES[Math.floor(Math.random() * PRAISE_LINES.length)];
  }

  return OFFLINE_ROASTS[Math.floor(Math.random() * OFFLINE_ROASTS.length)];
}
