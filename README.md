# AI Mystery Room

A responsive AI powered mystery game built with React, Vite, Express, MongoDB/Mongoose, and Gemini.

## Run locally

1. Install Node.js 20+ and MongoDB Community (or provide a MongoDB connection URL).
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set `MONGODB_URI`. Set `GEMINI_API_KEY` to enable generated cases; without a key, a validated built in demo case is used.
4. Run `npm run dev` and open http://localhost:5173.
5. Run `npm run build` to create the production frontend; `npm start` serves it and the API on port 4000.

## API

- `POST /api/cases` — create a case from `{premise,difficulty}`.
- `GET /api/cases/:id` — active player view (culprit and explanation are omitted).
- `POST /api/cases/:id/clues/:clueId/discover` — reveal a clue and award points.
- `POST /api/cases/:id/hints` — reveal the next hint and deduct points.
- `POST /api/cases/:id/accuse` — submit a suspect ID and complete the case.
- `GET /api/cases/:id/result` — completed result.

Scoring is enforced in the Express API. Gemini output is parsed and checked for expected counts and a valid culprit before persistence.
