# 🌍 Race Around The World

An interactive two-player trivia game where players race across the globe answering AI-generated questions about history, geography, and culture — now with a refreshed UI and shareable online rooms powered by Socket.IO.

[![View in AI Studio](https://img.shields.io/badge/AI_Studio-View_App-blue)](https://ai.studio/apps/drive/1H0bgtPglK6o-h5vIjf9lmeDnHx749nOL)

</div>

## 🎮 Game Overview

**Race Around The World** is a turn-based trivia game built with React, TypeScript, and Google's Gemini AI. Two players compete to be the first to reach their destination by correctly answering location-specific trivia questions.

### How It Works

1. **Setup**: Choose your starting city, destination, and player names
2. **Race**: Players take turns answering trivia questions about their current location
3. **Progress**: Answer correctly to move forward; incorrect answers keep you in place
4. **Win**: First player to reach the destination wins!

The game features:

- **20 global cities** spanning all continents (New York → Tokyo → Sydney and more)
- **AI-generated trivia** powered by Gemini 2.5 Flash for unique questions every game
- **Interactive world map** rendered with D3.js and TopoJSON
- **Private online rooms** with invite codes so friends can play remotely in real time
- **Smart question buffering** to ensure smooth gameplay without API delays

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **AI Integration**: Google GenAI SDK (`@google/genai`)
- **Map Rendering**: D3.js + TopoJSON (loaded from CDN)
- **Realtime**: Socket.IO 4 (client) + Express-based Socket.IO server
- **Styling**: Tailwind CSS (via classes)

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd race-around-the-world
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   The client expects `process.env.API_KEY` for Gemini requests and optionally `VITE_SOCKET_URL` if your realtime server is not on the default host machine (`{protocol}//{host}:4000`). When `VITE_SOCKET_URL` is omitted, browsers automatically target whatever IP served the app, which keeps LAN play simple.

   ```bash
   # .env.local
   API_KEY=your-gemini-key
   VITE_SOCKET_URL=http://localhost:4000
   ```

4. **Start the Socket.IO server**

   ```bash
   npm run server
   ```

   The server listens on port `4000` by default. Leave it running while you play online games.

5. **Run the Vite development server**

   ```bash
   npm run dev
   ```

   > Tip: `npm run dev:full` runs both the Socket.IO server and Vite watcher concurrently.

   Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```text
race-around-the-world/
├── App.tsx                  # Main game logic & state management
├── components/
│   ├── GameSetup.tsx        # Initial setup screen
│   ├── GameBoard.tsx        # Interactive world map & game UI
│   ├── Landing.tsx          # Mode selector (local vs online)
│   ├── OnlineLobby.tsx      # Socket.IO room creation/join flow
│   ├── QuestionDisplay.tsx  # Question presentation & answer handling
│   └── WinnerModal.tsx      # Victory screen
├── services/
│   ├── geminiService.ts     # AI integration (Gemini API calls)
│   └── socketService.ts     # Thin Socket.IO client helper
├── constants.ts             # Location data (20 cities)
├── server/
│   └── index.ts             # Express + Socket.IO realtime server
├── types.ts                 # TypeScript interfaces
└── index.tsx                # React entry point
```

## 🎯 Key Features & Implementation Details

### Question Management

- **Preloading**: Questions are fetched 2 locations ahead (`PRELOAD_AHEAD = 2`)
- **Buffer**: Maintains minimum 2 questions per location (`MIN_QUESTION_BUFFER = 2`)
- **Uniqueness**: Tracks used questions via Set to prevent repeats within a game
- **Queue**: `Map<string, TriviaQuestion[]>` keyed by location name

### AI Integration

- **Model**: Uses `gemini-2.5-flash` for fast, cost-effective generation
- **Schema Validation**: Enforces strict JSON schema with 4 options per question
- **Error Handling**: Gracefully skips turn if question generation fails
- **More Info**: Optional AI-powered explanations for correct answers

### Map Rendering

- **Global Dependencies**: D3 and TopoJSON loaded from unpkg CDN
- **Projection**: Mercator projection centered on world view
- **Dynamic Path**: Curved race path drawn between selected cities
- **Player Pins**: Custom SVG components with distinct colors

### Realtime Rooms (Socket.IO)

- **Mode selector**: `Landing.tsx` lets players choose Local play or Online Rooms
- **Room lifecycle**: `server/index.ts` tracks active rooms, enforces a two-player limit, and cleans up on disconnects
- **Host authority**: The host device runs the trivia logic and broadcasts sanitized game state via `host:state`; guests submit actions (ready, answer, more info, play again) through `client:action`
- **Invite codes**: Five-character, consonant-heavy codes are generated server-side and surfaced in the lobby + board headers for easy sharing
- **Graceful exits**: Leaving a room, switching modes, or hitting “Play Again” sends the appropriate socket events so every client returns to the lobby in sync

## ⚠️ Known Considerations

- **API Key Security**: Currently the API key is exposed client-side. For production, move AI calls to a backend server.
- **Network Dependency**: Map data fetched from `unpkg.com` at runtime. Won't work offline.
- **Question Quality**: AI-generated questions vary in difficulty. Consider adding difficulty levels or curation.
- **Socket server scope**: `server/index.ts` stores room metadata in memory. Deploy it close to your users and add persistence if you need longer-lived rooms or analytics.

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Move Gemini API calls to backend/serverless function
- Add difficulty settings
- Implement question caching
- Add sound effects and animations
- Create mobile-responsive layout

## 📄 License

MIT License - feel free to use this project for learning or building your own games!

## 🔗 Links

- [Google Gemini AI](https://ai.google.dev/)
- [AI Studio App](https://ai.studio/apps/drive/1H0bgtPglK6o-h5vIjf9lmeDnHx749nOL)
- [D3.js Documentation](https://d3js.org/)

---

Built with ❤️ using React, TypeScript, and Google Gemini AI
