export interface Location {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
}

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuestionRevealState {
  questionId: string;
  selectedAnswer: string | null;
  showResult: boolean;
  timedOut: boolean;
}

export type GameState =
  | "landing"
  | "setup"
  | "onlineLobby"
  | "playing"
  | "finished";

export type GameMode = "local" | "online";

export interface LobbyPlayer {
  id: string;
  name: string;
  avatarId: string;
  role: "host" | "guest";
}
