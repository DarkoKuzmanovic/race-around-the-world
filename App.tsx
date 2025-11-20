import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import type { Socket } from "socket.io-client";
import { Landing } from "./components/Landing";
import { GameSetup } from "./components/GameSetup";
import { GameBoard } from "./components/GameBoard";
import { WinnerModal } from "./components/WinnerModal";
import { OnlineLobby } from "./components/OnlineLobby";
import { getTriviaQuestions, getMoreInfo } from "./services/geminiService";
import {
  connectSocket,
  disconnectSocket,
  clearSocketInstance,
} from "./services/socketService";
import {
  GameState,
  GameMode,
  Location,
  TriviaQuestion,
  LobbyPlayer,
  QuestionRevealState,
} from "./types";
import { LOCATIONS } from "./constants";

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const generateRacePath = (start: Location, end: Location): Location[] => {
  const startIndex = LOCATIONS.findIndex((l) => l.name === start.name);
  const endIndex = LOCATIONS.findIndex((l) => l.name === end.name);
  if (startIndex === -1 || endIndex === -1) return [];

  if (startIndex <= endIndex) {
    return LOCATIONS.slice(startIndex, endIndex + 1);
  }
  return [...LOCATIONS.slice(startIndex), ...LOCATIONS.slice(0, endIndex + 1)];
};

interface SyncedStatePayload {
  gameState: GameState;
  racePath: Location[];
  player1Position: number;
  player2Position: number;
  player1Name: string;
  player2Name: string;
  player1AvatarId: string;
  player2AvatarId: string;
  currentPlayer: number;
  winner: string | null;
  currentQuestion: TriviaQuestion | null;
  questionReveal: QuestionRevealState | null;
  moreInfo: string | null;
  isMoreInfoLoading: boolean;
  isLoading: boolean;
}

const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [gameState, setGameState] = useState<GameState>("landing");
  const [racePath, setRacePath] = useState<Location[]>([]);
  const [player1Position, setPlayer1Position] = useState(0);
  const [player2Position, setPlayer2Position] = useState(0);
  const [player1Name, setPlayer1Name] = useState("Player 1");
  const [player2Name, setPlayer2Name] = useState("Player 2");
  const [player1AvatarId, setPlayer1AvatarId] = useState("male1");
  const [player2AvatarId, setPlayer2AvatarId] = useState("female1");
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [winner, setWinner] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(
    null,
  );
  const [questionReveal, setQuestionReveal] =
    useState<QuestionRevealState | null>(null);
  const [questionQueue, setQuestionQueue] = useState<
    Map<string, TriviaQuestion[]>
  >(new Map());
  const [usedQuestions, setUsedQuestions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [moreInfo, setMoreInfo] = useState<string | null>(null);
  const [isMoreInfoLoading, setIsMoreInfoLoading] = useState(false);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [playerRole, setPlayerRole] = useState<"host" | "guest" | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
  const [lobbyStatus, setLobbyStatus] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isLaunchingOnlineGame, setIsLaunchingOnlineGame] = useState(false);

  const remoteActionHandlersRef = useRef({
    readyForQuestion: () => {},
    answer: (_: boolean) => {},
    moreInfo: (_question: string, _answer: string) => {},
    reveal: (_state: QuestionRevealState) => {},
  });
  const handleResetGameRef = useRef<() => void>(() => {});
  const socketRef = useRef<Socket | null>(null);

  const isHost = gameMode === "online" && playerRole === "host";
  const isHostRef = useRef(isHost);
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  const isLocalPlayerTurn = useMemo(() => {
    if (gameMode !== "online") return true;
    if (playerRole === "host") return currentPlayer === 1;
    if (playerRole === "guest") return currentPlayer === 2;
    return false;
  }, [gameMode, playerRole, currentPlayer]);

  const preloadQuestions = useCallback(
    async (
      path: Location[],
      p1Pos: number,
      p2Pos: number,
      currentQueue: Map<string, TriviaQuestion[]>,
      currentUsed: Set<string>,
    ): Promise<Map<string, TriviaQuestion[]>> => {
      const locationsToCheck = new Set<string>();
      const PRELOAD_AHEAD = 2;
      const MIN_QUESTION_BUFFER = 2;

      for (let i = 0; i < PRELOAD_AHEAD; i++) {
        if (p1Pos + i < path.length) locationsToCheck.add(path[p1Pos + i].name);
        if (p2Pos + i < path.length) locationsToCheck.add(path[p2Pos + i].name);
      }

      const locationsNeedingFetch = [...locationsToCheck].filter((name) => {
        const available = currentQueue.get(name) || [];
        const unused = available.filter((q) => !currentUsed.has(q.question));
        return unused.length < MIN_QUESTION_BUFFER;
      });

      if (locationsNeedingFetch.length === 0) return currentQueue;

      const questionPromises = locationsNeedingFetch.map(getTriviaQuestions);
      const results = await Promise.allSettled(questionPromises);

      const newQueue = new Map<string, TriviaQuestion[]>(currentQueue);
      locationsNeedingFetch.forEach((name, index) => {
        const result = results[index];
        if (result.status === "fulfilled" && Array.isArray(result.value)) {
          const existing = newQueue.get(name) || [];
          const uniqueNewQuestions = result.value.filter(
            (nq) => !existing.some((eq) => eq.question === nq.question),
          );
          newQueue.set(name, [...existing, ...uniqueNewQuestions]);
        }
      });
      return newQueue;
    },
    [],
  );

  const resetGameData = useCallback(() => {
    setRacePath([]);
    setPlayer1Position(0);
    setPlayer2Position(0);
    setPlayer1AvatarId("male1");
    setPlayer2AvatarId("female1");
    setCurrentPlayer(1);
    setWinner(null);
    setCurrentQuestion(null);
    setQuestionReveal(null);
    setQuestionQueue(new Map());
    setUsedQuestions(new Set());
    setMoreInfo(null);
    setIsMoreInfoLoading(false);
    setIsLoading(false);
  }, []);

  const handleStartGame = useCallback(
    async (
      start: Location,
      end: Location,
      p1Name: string,
      p2Name: string,
      p1AvatarId: string,
      p2AvatarId: string,
    ) => {
      setIsLoading(true);
      const newPath = generateRacePath(start, end);
      setRacePath(newPath);
      setPlayer1Name(p1Name);
      setPlayer2Name(p2Name);
      setPlayer1AvatarId(p1AvatarId);
      setPlayer2AvatarId(p2AvatarId);
      setPlayer1Position(0);
      setPlayer2Position(0);
      setCurrentPlayer(1);
      setWinner(null);
      setCurrentQuestion(null);
      setQuestionReveal(null);
      setMoreInfo(null);
      setUsedQuestions(new Set());

      const newQueue = await preloadQuestions(
        newPath,
        0,
        0,
        new Map(),
        new Set(),
      );
      setQuestionQueue(newQueue);

      setGameState("playing");
      setIsLoading(false);
    },
    [preloadQuestions],
  );

  const handleReadyForQuestion = async () => {
    if (gameMode === "online" && !isHost) {
      socket?.emit("client:action", { type: "readyForQuestion" });
      return;
    }

    if (racePath.length === 0) return;

    const currentPosition =
      currentPlayer === 1 ? player1Position : player2Position;
    const location = racePath[currentPosition];
    if (!location) return;

    let availableQuestions = questionQueue.get(location.name) || [];
    let unusedQuestions = availableQuestions.filter(
      (q) => !usedQuestions.has(q.question),
    );

    if (unusedQuestions.length === 0) {
      setIsLoading(true);
      const newQuestions = await getTriviaQuestions(location.name);
      setIsLoading(false);

      if (!newQuestions || newQuestions.length === 0) {
        alert(`Failed to get a question for ${location.name}. Skipping turn.`);
        handleAnswer(false);
        return;
      }

      setQuestionQueue((prevQueue) => {
        const updatedQueue = new Map<string, TriviaQuestion[]>(prevQueue);
        const existing = updatedQueue.get(location.name) || [];
        const uniqueNewQuestions = newQuestions.filter(
          (nq) => !existing.some((eq) => eq.question === nq.question),
        );
        updatedQueue.set(location.name, [...existing, ...uniqueNewQuestions]);
        return updatedQueue;
      });

      unusedQuestions = newQuestions.filter(
        (q) => !usedQuestions.has(q.question),
      );

      if (unusedQuestions.length === 0) {
        alert(
          `Could not find a unique question for ${location.name}. Skipping turn.`,
        );
        handleAnswer(false);
        return;
      }
    }

    const questionToUse = unusedQuestions[0];
    setUsedQuestions((prev) => {
      const updated = new Set(prev);
      updated.add(questionToUse.question);
      return updated;
    });

    const shuffledQuestion = {
      ...questionToUse,
      options: shuffleArray([...questionToUse.options]),
    };

    setCurrentQuestion(shuffledQuestion);
    setQuestionReveal(null);
    setMoreInfo(null);
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (gameMode === "online" && !isHost) {
      socket?.emit("client:action", { type: "answer", payload: { isCorrect } });
      return;
    }

    setMoreInfo(null);
    setIsMoreInfoLoading(false);
    setCurrentQuestion(null);
    setQuestionReveal(null);

    let nextP1Pos = player1Position;
    let nextP2Pos = player2Position;
    let newWinner: string | null = null;
    const answeringPosition =
      currentPlayer === 1 ? player1Position : player2Position;
    const destinationIndex = Math.max(racePath.length - 1, 0);
    const isAnsweringAtDestination =
      racePath.length > 0 && answeringPosition === destinationIndex;

    if (isCorrect) {
      if (isAnsweringAtDestination) {
        newWinner = currentPlayer === 1 ? player1Name : player2Name;
        setWinner(newWinner);
        setGameState("finished");
      } else if (currentPlayer === 1) {
        nextP1Pos = Math.min(player1Position + 1, destinationIndex);
        setPlayer1Position(nextP1Pos);
      } else {
        nextP2Pos = Math.min(player2Position + 1, destinationIndex);
        setPlayer2Position(nextP2Pos);
      }
    }

    if (!newWinner) {
      const nextPlayer = currentPlayer === 1 ? 2 : 1;
      setCurrentPlayer(nextPlayer);
      preloadQuestions(
        racePath,
        nextP1Pos,
        nextP2Pos,
        questionQueue,
        usedQuestions,
      ).then(setQuestionQueue);
    }
  };

  const handleGetMoreInfo = async (question: string, answer: string) => {
    if (gameMode === "online" && !isHost) {
      socket?.emit("client:action", {
        type: "moreInfo",
        payload: { question, answer },
      });
      return;
    }

    setIsMoreInfoLoading(true);
    setMoreInfo(null);
    const info = await getMoreInfo(question, answer);
    setMoreInfo(info);
    setIsMoreInfoLoading(false);
  };

  const handleRemoteReveal = useCallback(
    (state: QuestionRevealState) => {
      setQuestionReveal((prev) => {
        if (!currentQuestion || state.questionId !== currentQuestion.question) {
          return prev;
        }
        return state;
      });
    },
    [currentQuestion],
  );

  const handleQuestionReveal = useCallback(
    (state: Omit<QuestionRevealState, "questionId">) => {
      if (!currentQuestion) return;
      const payload: QuestionRevealState = {
        questionId: currentQuestion.question,
        ...state,
      };
      setQuestionReveal(payload);

      if (gameMode === "online" && !isHost) {
        socket?.emit("client:action", { type: "reveal", payload });
      }
    },
    [currentQuestion, gameMode, isHost, socket],
  );

  remoteActionHandlersRef.current = {
    readyForQuestion: handleReadyForQuestion,
    answer: handleAnswer,
    moreInfo: handleGetMoreInfo,
    reveal: handleRemoteReveal,
  };

  const handleResetGame = useCallback(() => {
    resetGameData();
    setGameState(gameMode === "online" ? "onlineLobby" : "setup");
  }, [gameMode, resetGameData]);

  useEffect(() => {
    handleResetGameRef.current = handleResetGame;
  }, [handleResetGame]);

  const applySyncedState = useCallback((state: SyncedStatePayload) => {
    setGameState(state.gameState);
    setRacePath(state.racePath);
    setPlayer1Position(state.player1Position);
    setPlayer2Position(state.player2Position);
    setPlayer1Name(state.player1Name);
    setPlayer2Name(state.player2Name);
    setPlayer1AvatarId(state.player1AvatarId);
    setPlayer2AvatarId(state.player2AvatarId);
    setCurrentPlayer(state.currentPlayer);
    setWinner(state.winner);
    setCurrentQuestion(state.currentQuestion);
    setQuestionReveal(state.questionReveal);
    setMoreInfo(state.moreInfo);
    setIsMoreInfoLoading(state.isMoreInfoLoading);
    setIsLoading(state.isLoading);
  }, []);

  useEffect(() => {
    if (gameMode !== "online") {
      const existingSocket = socketRef.current;
      if (existingSocket) {
        existingSocket.emit("leaveRoom");
        disconnectSocket();
        clearSocketInstance();
        socketRef.current = null;
        setSocket(null);
      }
      setRoomCode(null);
      setPlayerRole(null);
      setLobbyPlayers([]);
      setLobbyStatus(null);
      setIsSocketConnected(false);
      return;
    }

    const instance = connectSocket();
    socketRef.current = instance;
    setSocket(instance);

    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => {
      setIsSocketConnected(false);
      setLobbyStatus("Reconnecting to the realtime server…");
    };
    const handleRoomCreated = ({
      code,
      player,
    }: {
      code: string;
      player: LobbyPlayer;
    }) => {
      setRoomCode(code);
      setPlayerRole("host");
      setLobbyPlayers([player]);
      // Set avatar for player 1 if they're the host
      if (player.role === "host") {
        setPlayer1AvatarId(player.avatarId || "explorer");
      }
      setLobbyStatus("Room live! Share the code with a friend.");
    };
    const handleRoomJoined = ({
      code,
      player,
    }: {
      code: string;
      player: LobbyPlayer;
    }) => {
      setRoomCode(code);
      setPlayerRole("guest");
      // Set avatar for player 2 if they're the guest
      if (player.role === "guest") {
        setPlayer2AvatarId(player.avatarId || "pilot");
      }
      setLobbyStatus("Joined room. Waiting for the host to start.");
      setGameState("onlineLobby");
    };
    const handleRoomUpdate = ({
      players,
    }: {
      code: string;
      players: LobbyPlayer[];
    }) => {
      const ordered = [...players].sort((a, b) => (a.role === "host" ? -1 : 1));
      setLobbyPlayers(ordered);
      setLobbyStatus(null);
    };
    const handleRoomError = (message: string) => {
      setLobbyStatus(message);
    };
    const handleRoomClosed = () => {
      setRoomCode(null);
      setPlayerRole(null);
      setLobbyPlayers([]);
      resetGameData();
      setGameState("onlineLobby");
      setLobbyStatus("The host left the room.");
    };
    const handleStateSync = (state: SyncedStatePayload) => {
      if (isHostRef.current) return;
      applySyncedState(state);
    };
    const handleRoomAction = ({
      payload,
    }: {
      from: string;
      payload: { type: string; payload?: any };
    }) => {
      const action = payload?.type;
      if (!action) return;
      if (action === "playAgain") {
        handleResetGameRef.current();
        return;
      }
      const handlers = remoteActionHandlersRef.current;
      if (action === "readyForQuestion") {
        handlers.readyForQuestion();
      } else if (action === "answer") {
        handlers.answer(payload.payload?.isCorrect ?? false);
      } else if (action === "moreInfo") {
        const questionText = payload.payload?.question;
        const answerText = payload.payload?.answer;
        if (questionText && answerText) {
          handlers.moreInfo(questionText, answerText);
        }
      } else if (action === "reveal") {
        const revealState = payload.payload as QuestionRevealState | undefined;
        if (revealState) {
          handlers.reveal(revealState);
        }
      }
    };

    instance.on("connect", handleConnect);
    instance.on("disconnect", handleDisconnect);
    instance.on("room:created", handleRoomCreated);
    instance.on("room:joined", handleRoomJoined);
    instance.on("room:update", handleRoomUpdate);
    instance.on("room:error", handleRoomError);
    instance.on("room:closed", handleRoomClosed);
    instance.on("state:sync", handleStateSync);
    instance.on("room:action", handleRoomAction);

    return () => {
      instance.emit("leaveRoom");
      instance.off("connect", handleConnect);
      instance.off("disconnect", handleDisconnect);
      instance.off("room:created", handleRoomCreated);
      instance.off("room:joined", handleRoomJoined);
      instance.off("room:update", handleRoomUpdate);
      instance.off("room:error", handleRoomError);
      instance.off("room:closed", handleRoomClosed);
      instance.off("state:sync", handleStateSync);
      instance.off("room:action", handleRoomAction);
      disconnectSocket();
      clearSocketInstance();
      socketRef.current = null;
      setSocket(null);
      setIsSocketConnected(false);
    };
  }, [gameMode, applySyncedState, resetGameData]);

  useEffect(() => {
    if (gameMode !== "online") return;
    const hostPlayer = lobbyPlayers.find((player) => player.role === "host");
    const guestPlayer = lobbyPlayers.find((player) => player.role === "guest");
    if (hostPlayer) {
      setPlayer1Name(hostPlayer.name);
      setPlayer1AvatarId(hostPlayer.avatarId || "explorer");
    }
    if (guestPlayer) {
      setPlayer2Name(guestPlayer.name);
      setPlayer2AvatarId(guestPlayer.avatarId || "pilot");
    } else if (lobbyPlayers.length <= 1) {
      setPlayer2Name("Awaiting Player");
      setPlayer2AvatarId("pilot");
    }
  }, [lobbyPlayers, gameMode]);

  const sharedState = useMemo<SyncedStatePayload>(
    () => ({
      gameState,
      racePath,
      player1Position,
      player2Position,
      player1Name,
      player2Name,
      player1AvatarId,
      player2AvatarId,
      currentPlayer,
      winner,
      currentQuestion,
      questionReveal,
      moreInfo,
      isMoreInfoLoading,
      isLoading,
    }),
    [
      gameState,
      racePath,
      player1Position,
      player2Position,
      player1Name,
      player2Name,
      player1AvatarId,
      player2AvatarId,
      currentPlayer,
      winner,
      currentQuestion,
      questionReveal,
      moreInfo,
      isMoreInfoLoading,
      isLoading,
    ],
  );

  useEffect(() => {
    if (
      gameMode !== "online" ||
      !isHost ||
      !socket ||
      !socket.connected ||
      !roomCode
    )
      return;
    socket.emit("host:state", sharedState);
  }, [sharedState, socket, roomCode, gameMode, isHost]);

  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    setGameState(mode === "local" ? "setup" : "onlineLobby");
    resetGameData();
    if (mode === "local") {
      setPlayer1Name("Player 1");
      setPlayer2Name("Player 2");
      if (socket) {
        socket.emit("leaveRoom");
      }
      setRoomCode(null);
      setPlayerRole(null);
      setLobbyPlayers([]);
      setLobbyStatus(null);
    }
  };

  const handleReturnToLanding = () => {
    if (gameMode === "online" && socket) {
      socket.emit("leaveRoom");
      disconnectSocket();
      clearSocketInstance();
      setSocket(null);
      socketRef.current = null;
    }
    setGameMode(null);
    setGameState("landing");
    resetGameData();
    setRoomCode(null);
    setPlayerRole(null);
    setLobbyPlayers([]);
    setLobbyStatus(null);
    setPlayer1Name("Player 1");
    setPlayer2Name("Player 2");
  };

  const handleCreateRoom = (name: string, avatarId: string) => {
    if (!socket) return;
    setLobbyStatus("Creating room…");
    socket.emit("createRoom", { name, avatarId });
  };

  const handleJoinRoom = (code: string, name: string, avatarId: string) => {
    if (!socket) return;
    setLobbyStatus("Requesting to join…");
    socket.emit("joinRoom", { code, name, avatarId });
  };

  const handleLeaveRoom = () => {
    socket?.emit("leaveRoom");
    setRoomCode(null);
    setPlayerRole(null);
    setLobbyPlayers([]);
    resetGameData();
    setGameState("onlineLobby");
    setLobbyStatus("You left the room.");
  };

  const handleOnlineGameStart = async (start: Location, end: Location) => {
    if (!isHost) return;
    setIsLaunchingOnlineGame(true);
    try {
      await handleStartGame(start, end, player1Name, player2Name);
    } finally {
      setIsLaunchingOnlineGame(false);
    }
  };

  const handlePlayAgainRequest = () => {
    if (gameMode === "online" && !isHost) {
      socket?.emit("client:action", { type: "playAgain" });
      return;
    }
    handleResetGame();
  };

  const handleReturnToSetup = () => {
    if (gameMode === "local") {
      resetGameData();
      setGameState("setup");
    } else {
      handleReturnToLanding();
    }
  };

  const renderGameState = () => {
    if (gameState === "landing") {
      return <Landing onSelectMode={handleSelectMode} />;
    }

    if (gameState === "onlineLobby" && gameMode === "online") {
      return (
        <OnlineLobby
          isConnected={isSocketConnected}
          roomCode={roomCode}
          playerRole={playerRole}
          players={lobbyPlayers}
          statusMessage={lobbyStatus}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onLeaveRoom={handleLeaveRoom}
          onStartGame={handleOnlineGameStart}
          isLaunching={isLaunchingOnlineGame}
          onBackToLanding={handleReturnToLanding}
        />
      );
    }

    if (gameState === "setup" && gameMode === "local") {
      return (
        <GameSetup onStartGame={handleStartGame} onExit={handleReturnToSetup} />
      );
    }

    if (gameState === "playing" && racePath.length === 0) return null;

    if (gameState === "playing" || gameState === "finished") {
      return (
        <>
          <GameBoard
            path={racePath}
            player1Position={player1Position}
            player2Position={player2Position}
            currentPlayer={currentPlayer}
            player1Name={player1Name}
            player2Name={player2Name}
            player1AvatarId={player1AvatarId}
            player2AvatarId={player2AvatarId}
            currentQuestion={currentQuestion}
            questionReveal={questionReveal}
            onReadyForQuestion={handleReadyForQuestion}
            onAnswer={handleAnswer}
            onRevealStateChange={handleQuestionReveal}
            onGetMoreInfo={handleGetMoreInfo}
            moreInfo={moreInfo}
            isMoreInfoLoading={isMoreInfoLoading}
            gameMode={gameMode}
            roomCode={roomCode}
            onExit={handleReturnToSetup}
            isLocalPlayerTurn={
              gameMode === "local" ||
              (gameMode === "online" && isLocalPlayerTurn)
            }
          />
          {winner && gameState === "finished" && (
            <WinnerModal winner={winner} onPlayAgain={handlePlayAgainRequest} />
          )}
        </>
      );
    }

    return null;
  };

  return (
    <>
      {renderGameState()}
      {isLoading && (
        <div className="fixed inset-0 bg-neo-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-neo-white border-neo border-neo-black p-8 shadow-neo-lg animate-bounce">
            <div className="text-neo-black text-2xl font-neo-display font-bold uppercase">
              Fetching new questions...
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
