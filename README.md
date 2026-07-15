# Commitachi 🐱

**Your terminal pet that feeds on git commits. Keep coding or it starves.**

Commitachi is a virtual pet that lives in your terminal and thrives on your git activity. Every commit you make feeds it, levels it up, and earns you badges. Neglect it, and it gets hungry, sad, and eventually... well, let's not go there.

It also roasts your commit messages. And it's not gentle about it.

## Quick Demo

```
$ commitachi

  ── Commitachi ──

    ╱|、
   (˚ˎ 。7
    |、˜〵
    じしˍ,)ノ

  Commitachi (Lv.4 Code Monkey)

  Health       ████████████████████ 100%
  Hunger       ██████░░░░░░░░░░░░░░ 30%
  Happiness    ██████████████████░░ 90%

  Commits: 47  Streak: 5 days  XP: 680

  Last roast: "Your git blame looks like a crime scene report."
```

## Features

- **Terminal pet** with ASCII art that changes based on mood (happy, hungry, angry, sleeping, dead)
- **Git commit tracking** — feed your pet by committing code
- **AI-powered roasts** via Gemini API (works offline too with built-in snarky responses)
- **Leveling system** — evolve from Egg → Hatchling → Junior Dev → ... → 10x Engineer → Linus Torvalds
- **Achievement badges** — Night Owl, Commit Machine, Hot Streak, and more
- **Web dashboard** — holographic 3D pet card, stat bars, badge rack, roast history

## Installation

```bash
# clone and install
git clone https://github.com/senotron/commitachi.git
cd commitachi
npm install

# optional: link globally so you can run `commitachi` from anywhere
npm link
```

## Usage

```bash
# show your pet status
commitachi

# feed your pet (run this inside any git repo)
commitachi feed

# detailed status report
commitachi status

# open the web dashboard in your browser
commitachi web

# save your Gemini API key for AI-powered roasts
commitachi config key YOUR_GEMINI_API_KEY
```

If you don't have a Gemini API key, don't worry — Commitachi ships with plenty of built-in roasts.

## Web Dashboard

Run `commitachi web` to open a local dashboard at `http://localhost:3727` with:

- Interactive 3D holographic pet card (tracks your mouse movement)
- Real-time health, hunger, and happiness meters
- XP progress toward next evolution
- Badge collection grid
- Full roast history stream
- Gemini API key configuration

## Level Progression

| Level | Title | XP Required |
|-------|-------|------------|
| 1 | Egg | 0 |
| 2 | Hatchling | 50 |
| 3 | Junior Dev | 150 |
| 4 | Code Monkey | 400 |
| 5 | Mid-Level | 800 |
| 6 | Senior Dev | 1,500 |
| 7 | Architect | 3,000 |
| 8 | 10x Engineer | 6,000 |
| 9 | Mass Maniac | 10,000 |
| 10 | Linus Torvalds | 20,000 |

## Badges

| Badge | How to earn |
|-------|------------|
| 🍼 First Bite | Feed your pet for the first time |
| ⚔️ Commit Warrior | 10 commits fed |
| 🤖 Commit Machine | 50 commits fed |
| 👑 Centurion | 100 commits fed |
| 🦉 Night Owl | Commit after midnight |
| 🐦 Early Bird | Commit before 7 AM |
| 🔥 Hot Streak | 3-day commit streak |
| 💥 On Fire | 7-day commit streak |

## How it works

Commitachi stores your pet's state in `~/.commitachi/state.json`. When you run `commitachi feed` inside a git repository, it:

1. Reads your latest commit (message, hash, timestamp)
2. Awards XP and reduces hunger
3. Checks for new badges based on the commit time and streak
4. Generates a roast about your commit message (via Gemini API or offline)
5. Saves everything

Your pet's hunger increases over time (~4 points/hour). If hunger hits 80%+, health starts dropping. Keep feeding it.

## Tech Stack

- **CLI:** Node.js, picocolors (terminal colors), dotenv
- **AI:** Google Gemini API (optional)
- **Dashboard:** React, Vite, vanilla CSS, canvas-confetti, lucide-react
- **Server:** Express (serves dashboard + API)

## License

MIT
