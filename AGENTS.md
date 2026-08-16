# AGENTS.md

React 19 + Vite + Tailwind v4 + Firebase (Auth/Firestore) SPA for a pickleball ELO tracker. Deployed on Vercel.

## Commands

- `npm run dev` — dev server on **:3000**
- `npm run build` — production build
- `npm run lint` — `tsc --noEmit` only (no eslint/prettier, no test suite). Run lint + build before finishing.

## Firebase setup (gotchas)

- Real config lives in the **checked-in** `firebase-applet-config.json` at repo root, imported via `@/firebase-applet-config.json`. `.env.example`'s `VITE_FIREBASE_*` vars are **not** consumed by the app — do not introduce env-based config.
- `firestoreDatabaseId: ""` means the default DB.
- `src/firebase.ts` exports `db`, `auth`, and `handleFirestoreError` (wraps all Firestore errors).
- `firestore.rules` is currently permissive (any authenticated user read/write) and deployed manually. `security_spec.md` documents the intended stricter rules ("Dirty Dozen" threat model) which the rules file does **not** yet implement — check it before touching rules.

## Architecture

- Layered: `src/repositories/*` (Firestore CRUD + `onSnapshot` real-time subscriptions) → `src/services/*` (business logic, audit logging) → `App.tsx` (single ~780-line state hub that wires everything) → `src/components/*`.
- Put data access in repositories, logic in services; don't duplicate patterns.
- Path alias `@/*` maps to the **repo root**, not `src` (e.g. `@/firebase-applet-config.json`).
- **Two parallel Elo implementations**: `src/eloService.ts` (functional; used by `AdminView` for anti-farming/manual adjustment) and `src/services/EloService.ts` (class-based). Don't collapse one into the other without checking callers.
- Types in `src/types.ts`; `Player = User` and `MatchActivity = Match` are compat aliases.

## Quirks

- `StrictMode` is enabled — effects run twice in dev (watch for duplicate Firestore listener setup).
- Tailwind v4 via `@tailwindcss/vite` plugin; no `tailwind.config.js`.
- `vite.config.ts` disables HMR/file-watching when `DISABLE_HMR=true` (AI Studio). Do not modify that logic.
- No backend: `express`/`@google/genai`/`dotenv` deps and the `server-side Gemini` claim in `metadata.json` are unused — there is zero server code; Vercel is a pure SPA rewrite (`vercel.json`).
