# Versona — Collaborator Setup

Welcome! This guide gets you from zero to a running local copy of Versona that you can edit with Claude Code (desktop app or Cowork).

Repo: https://github.com/katgeorgelas-commits/versona

---

## 1. Install prerequisites

You need three things on your machine:

### Git
Check: open Terminal and run `git --version`.
If missing:
- **Mac**: `xcode-select --install`, or install from https://git-scm.com
- **Windows**: https://git-scm.com/download/win

### Node.js (v18 or newer)
Check: `node --version`.
If missing: install the LTS version from https://nodejs.org (or `brew install node` on Mac).

### GitHub CLI (recommended — makes auth easy)
Check: `gh --version`.
If missing:
- **Mac**: `brew install gh`
- **Windows**: https://cli.github.com

Then sign in:
```
gh auth login
```
Pick GitHub.com → HTTPS → "Login with a web browser" and follow the prompts.

---

## 2. Install Claude Code

Two options — pick one:

### Option A: Claude Code desktop app
- Download from https://claude.com/claude-code (Mac or Windows)
- Sign in with your Anthropic account (Pro, Max, or Team plan)

### Option B: Cowork (web)
- Go to https://claude.ai/code and sign in

Both work the same way for this project.

---

## 3. Clone the repo

In Terminal:
```
cd ~/Downloads
git clone https://github.com/katgeorgelas-commits/versona.git
cd versona
```

(You can clone anywhere — `~/Downloads` just matches Kat's setup.)

---

## 4. Open the project in Claude Code

- **Desktop app**: File → Open Folder → pick the `versona` folder
- **Cowork**: open the project and point it at the cloned folder

Then just tell Claude:
> Install dependencies and start the dev server.

It'll run `npm install` and `npm run dev`. The app will be live at http://localhost:3000.

---

## 5. Day-to-day workflow

**Before you start working** — always pull the latest:
```
git pull
```
Or just ask Claude: *"Pull the latest from main."*

**When you're done with a change** — commit and push:
Ask Claude: *"Commit this and push to main."*

That's it. Both of us push to `main` directly for now since it's just the two of us on an MVP. If we start stepping on each other, we'll switch to feature branches + PRs.

---

## 6. If something breaks

- **Merge conflict on pull** → ask Claude to resolve it; it'll walk through the conflicting files
- **App won't start** → `rm -rf node_modules .next && npm install`, then `npm run dev`
- **Auth issues with git push** → re-run `gh auth login`

---

## What's in this repo

- **Next.js 14** app (App Router) — `src/app/`
- **Supabase** for auth + database — `supabase/migrations/`
- **Tailwind** for styling — `tailwind.config.ts`
- **Claude API** integration — see `.env.example` for keys we'll wire up later
- **Docs** — `docs/` has product notes and architecture

No real secrets are committed. `.env.example` is a template; when we add real keys, they go in `.env.local` (which is gitignored).

---

Questions? Ping Kat.
