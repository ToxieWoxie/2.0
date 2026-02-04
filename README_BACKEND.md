# Synesthete Backend (Express + Mongo + Cookie Auth)

This backend is designed to match the Expo frontend’s API calls in `Syn/lib/auth.ts` and uses
JWT stored in an HttpOnly cookie (`token`) so the frontend can use `credentials: "include"`.

## Setup
1. From `server/`:
   - `npm i`
2. Create `server/.env` using `.env.example`.
3. Run:
   - `npm run dev`

## Frontend (Expo Web @ http://localhost:8081)
Create `Syn/.env` (next to `Syn/package.json`) with:

EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

Then restart Expo.
