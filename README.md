# Lake Travis Pickleball Club — ELO Tracker

Pro-tracker platform for pickleball performance analytics and club elo rankings.

**Hosted:** https://ltpickleball.vercel.app

## Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Firebase (Auth, Firestore)
- **Hosting:** Vercel

## Features

- Email/password authentication
- ELO rating system with K-factors, margin-of-victory, and anti-farming rules
- Challenge system (create, accept, submit scores, verify, dispute)
- Leaderboard with tier rankings
- Season management and medal awards
- Admin panel for user management and manual adjustments
- Avatar system with 20 custom cartoon portraits
- Admin approval for new members
- Password reset via email

## Development

```bash
npm install
npm run dev       # local dev server on :3000
npm run build     # production build
npm run lint      # type-check only
```

## Firestore Rules

Deploy rules from `firestore.rules` to the Firebase project via Console or CLI.
