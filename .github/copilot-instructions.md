## Quick orientation for AI coding agents

This is a small React + Vite TypeScript game that fetches trivia via Google GenAI and renders a world map using D3/topojson.
Be focused and concrete: refer to the files below for the authoritative behavior and data shapes.

Key points

- App entry: `App.tsx` orchestrates game state, preloads questions, and manages the question queue (Map<string, TriviaQuestion[]>).
- UI: `components/` contains the main screens. `GameBoard.tsx` renders the map with D3 and exposes hooks for requesting questions and answering them.
- AI integration: `services/geminiService.ts` uses `@google/genai` to generate JSON arrays of TriviaQuestion objects. The function `getTriviaQuestions(locationName, count)` returns an array matching the schema { question, options[4], correctAnswer } or null on error.
- Data flow: questions are queued per-location by name; uniqueness is enforced by the `question` string stored in `usedQuestions` (a Set).

Files to inspect for behavior examples

- `App.tsx` — game lifecycle, `preloadQuestions` implementation, question buffer rules (PRELOAD_AHEAD = 2, MIN_QUESTION_BUFFER = 2).
- `components/GameBoard.tsx` — uses global `d3` and `topojson` (loaded from unpkg at runtime). Projection and path drawing are done client-side.
- `services/geminiService.ts` — authoritative prompt, response schema enforcement, and the exact model name `gemini-2.5-flash`.
- `package.json` — scripts: `npm run dev` (vite), `npm run build`, `npm run preview`.

Environment & running locally (Windows PowerShell)

- Install: `npm install`
- Set API key (service expects `process.env.API_KEY` in code):
  - PowerShell (one-off):
    ```powershell
    $env:API_KEY = 'your-key-here'
    npm run dev
    ```
  - Alternatively create an `.env.local` if you prefer (README mentions `GEMINI_API_KEY` but the service code reads `API_KEY`). See `services/geminiService.ts` for the exact env var used.

Notable conventions & gotchas

- Question queue key: locations are keyed by `location.name` (strings like "City, Country"). Do not change the key shape without updating `App.tsx` usages.
- Unique-question logic uses the raw `question` string to mark used items. If you change question normalization, update `usedQuestions` logic.
- `geminiService.ts` runs `@google/genai` directly from the client-side codebase. That exposes an API key if shipped to the browser — this is the repository's current layout and is discoverable here; treat changes to that integration carefully and note security/hosting implications.
- Map libraries are used as globals: code declares `declare const d3: any; declare const topojson: any;` and loads country data from `https://unpkg.com/world-atlas@2/countries-110m.json` at runtime. Offline or restricted networks will affect dev runs.

Testing & validation hints

- `getTriviaQuestions` validates the AI response and returns `null` on invalid shape; callers in `App.tsx` expect `null`/empty handling and may skip turns.
- When adding or changing the response schema, update the `triviaQuestionSchema` in `services/geminiService.ts` and the TypeScript `TriviaQuestion` type in `types.ts`.

If anything above is unclear or you want a different focus (security,tests,or refactor suggestions), tell me which area to expand and I will iterate.
