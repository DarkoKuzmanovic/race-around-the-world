import React, { useEffect, useState, useMemo } from "react";
import {
  GameMode,
  Location,
  TriviaQuestion,
  QuestionRevealState,
} from "../types";
import { PlayerPin } from "./icons/PlayerPin";
import { AvatarPin } from "./avatars/AvatarPin";
import { AvatarDisplay } from "./avatars/AvatarGallery";
import { QuestionDisplay } from "./QuestionDisplay";

declare const d3: any;
declare const topojson: any;

interface GameBoardProps {
  path: Location[];
  player1Position: number;
  player2Position: number;
  currentPlayer: number;
  player1Name: string;
  player2Name: string;
  player1AvatarId: string;
  player2AvatarId: string;
  currentQuestion: TriviaQuestion | null;
  questionReveal: QuestionRevealState | null;
  onReadyForQuestion: () => void;
  onAnswer: (isCorrect: boolean) => void;
  onRevealStateChange: (state: Omit<QuestionRevealState, "questionId">) => void;
  onGetMoreInfo: (question: string, answer: string) => Promise<void>;
  moreInfo: string | null;
  isMoreInfoLoading: boolean;
  gameMode: GameMode;
  roomCode?: string | null;
  onExit?: () => void;
  isLocalPlayerTurn: boolean;
}

const width = 960;
const height = 500;

export const GameBoard: React.FC<GameBoardProps> = ({
  path,
  player1Position,
  player2Position,
  currentPlayer,
  player1Name,
  player2Name,
  player1AvatarId,
  player2AvatarId,
  currentQuestion,
  questionReveal,
  onReadyForQuestion,
  onAnswer,
  onRevealStateChange,
  onGetMoreInfo,
  moreInfo,
  isMoreInfoLoading,
  gameMode,
  roomCode,
  onExit,
  isLocalPlayerTurn,
}) => {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    d3.json("https://unpkg.com/world-atlas@2/countries-110m.json").then(
      (data: any) => {
        setGeoData(topojson.feature(data, data.objects.countries));
      },
    );
  }, []);

  const projection = useMemo(
    () =>
      d3
        .geoMercator()
        .scale(130)
        .translate([width / 2, height / 1.5]),
    [],
  );
  const geoPathGenerator = useMemo(
    () => d3.geoPath().projection(projection),
    [projection],
  );

  const pathSegments = useMemo(() => {
    if (path.length < 2) return [];
    const lineGenerator = d3.line().curve(d3.curveCatmullRom.alpha(0.5));
    return path
      .slice(0, -1)
      .map((loc, index) => {
        const next = path[index + 1];
        const interpolator = d3.geoInterpolate(
          loc.coordinates,
          next.coordinates,
        );
        const distance = d3.geoDistance(loc.coordinates, next.coordinates);
        const samples = Math.max(12, Math.ceil(distance * 64));
        const points: [number, number][] = [];
        for (let i = 0; i <= samples; i++) {
          const [lon, lat] = interpolator(i / samples);
          const projected = projection([lon, lat]);
          if (projected) {
            points.push(projected as [number, number]);
          }
        }
        if (points.length < 2) return null;
        return lineGenerator(points as [number, number][]);
      })
      .filter(Boolean);
  }, [path, projection]);

  const clampPosition = (position: number) => {
    if (path.length === 0) return 0;
    return Math.min(Math.max(position, 0), path.length - 1);
  };

  const safePlayer1Pos = clampPosition(player1Position);
  const safePlayer2Pos = clampPosition(player2Position);
  const currentTurnPlayerPosition =
    currentPlayer === 1 ? safePlayer1Pos : safePlayer2Pos;

  const fallbackCoordinates: [number, number] = path[0]?.coordinates ?? [0, 0];
  const projectCoordinates = (
    coordinates?: [number, number],
  ): [number, number] => {
    const projected = coordinates
      ? projection(coordinates)
      : projection(fallbackCoordinates);
    if (!projected) {
      return projection(fallbackCoordinates) as [number, number];
    }
    return projected as [number, number];
  };

  const player1Coords = projectCoordinates(path[safePlayer1Pos]?.coordinates);
  const player2Coords = projectCoordinates(path[safePlayer2Pos]?.coordinates);

  const totalStops = Math.max(path.length - 1, 1);
  const progressFor = (position: number) =>
    Math.min(100, (position / totalStops) * 100);

  const currentTurnPlayerName = currentPlayer === 1 ? player1Name : player2Name;
  const currentTurnLocationName =
    path[currentTurnPlayerPosition]?.name ?? "Destination";

  const renderMap = () => {
    if (!geoData) {
      return (
        <text x={width / 2} y={height / 2} fill="white" textAnchor="middle">
          Loading Map...
        </text>
      );
    }
    return (
      <g>
        {geoData.features.map((feature: any, i: number) => (
          <path
            key={i}
            d={geoPathGenerator(feature)}
            className="fill-neo-white stroke-neo-black stroke-1"
          />
        ))}
      </g>
    );
  };

  const playerCards = [
    {
      name: player1Name,
      color: "from-blue-500 to-cyan-400",
      accent: "bg-blue-500/10",
      position: safePlayer1Pos,
      location: path[safePlayer1Pos]?.name,
      progress: progressFor(safePlayer1Pos),
      isActive: currentPlayer === 1,
    },
    {
      name: player2Name,
      color: "from-rose-500 to-orange-400",
      accent: "bg-rose-500/10",
      position: safePlayer2Pos,
      location: path[safePlayer2Pos]?.name,
      progress: progressFor(safePlayer2Pos),
      isActive: currentPlayer === 2,
    },
  ];

  const gradientId = "race-route-gradient";
  const glowId = "race-route-glow";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl neo-card relative">
        <div className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b-4 border-neo-black">
          {onExit && (
            <button
              onClick={onExit}
              className="text-sm font-bold uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
            >
              ← {gameMode === "online" ? "Leave room" : "Change mode"}
            </button>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1 font-bold uppercase tracking-widest bg-neo-black text-neo-white border-2 border-neo-black">
              {gameMode === "online" ? "Online room" : "Local duel"}
            </span>
            {roomCode && (
              <span className="px-3 py-1 font-mono font-bold tracking-widest bg-neo-white border-2 border-neo-black">
                {roomCode}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 grid gap-6 md:grid-cols-2">
          {playerCards.map((player) => (
            <div
              key={player.name}
              className={`border-4 ${
                player.isActive
                  ? "border-neo-black bg-neo-yellow"
                  : "border-neo-black bg-neo-white"
              } p-4 transition-colors shadow-neo-sm`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1">
                    {player.isActive ? "Taking off" : "Cruising"}
                  </p>
                  <p className="text-2xl font-neo-display font-bold uppercase">
                    {player.name}
                  </p>
                </div>
                <div
                  className={`border-4 border-neo-black ${player.name === player1Name ? "bg-blue-100" : "bg-red-100"}`}
                >
                  <AvatarDisplay
                    avatarId={
                      player.name === player1Name
                        ? player1AvatarId
                        : player2AvatarId
                    }
                    size="small"
                  />
                </div>
              </div>
              <p className="text-sm font-bold mt-2 border-t-2 border-neo-black pt-2">
                {player.location || "On the move"}
              </p>
              <div className="h-3 bg-neo-white border-2 border-neo-black mt-3 relative">
                <div
                  className={`h-full bg-neo-black transition-all duration-500`}
                  style={{ width: `${player.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-y-4 border-neo-black relative bg-neo-blue/10">
          {currentQuestion ? (
            <QuestionDisplay
              question={currentQuestion}
              locationName={currentTurnLocationName}
              onAnswer={onAnswer}
              onRevealStateChange={onRevealStateChange}
              onGetMoreInfo={onGetMoreInfo}
              moreInfo={moreInfo}
              isMoreInfoLoading={isMoreInfoLoading}
              isInteractive={isLocalPlayerTurn}
              revealedState={questionReveal}
              currentPlayerName={currentTurnPlayerName}
            />
          ) : (
            <div className="p-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.4em] mb-2">
                  Next stop
                </p>
                <h1 className="text-4xl font-neo-display font-bold uppercase">
                  {currentTurnLocationName}
                </h1>
                <p className="mt-2 font-neo-body">
                  It&apos;s{" "}
                  <span className="font-bold bg-neo-black text-neo-white px-1">
                    {currentTurnPlayerName}
                  </span>
                  &apos;s turn.
                </p>
              </div>
              <button
                onClick={onReadyForQuestion}
                className="bg-neo-blue border-4 border-neo-black shadow-neo-lg text-xl w-full md:w-auto py-4 px-8 text-xl font-neo-display font-bold uppercase tracking-wider transition-all transform hover:scale-105 hover:bg-neo-black hover:text-neo-blue active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                GET QUESTION
              </button>
            </div>
          )}
        </div>

        <div className="relative bg-neo-blue/20 border-b-4 border-neo-black">
          <svg
            width="100%"
            viewBox={`0 0 ${width} ${height}`}
            className="bg-neo-blue/20"
          >
            {renderMap()}
            {pathSegments.map((segment: string, idx: number) => (
              <g key={`segment-${idx}`}>
                <path
                  d={segment}
                  fill="none"
                  stroke="#000000"
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={segment}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="10,10"
                />
              </g>
            ))}
            {path.map((loc, i) => {
              const projected = projection(loc.coordinates);
              if (!projected) return null;
              const [cx, cy] = projected;
              const isStart = i === 0;
              const isEnd = i === path.length - 1;
              return (
                <g key={loc.name}>
                  <circle cx={cx} cy={cy} r={8} className="fill-neo-black" />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isStart || isEnd ? 6 : 4}
                    className={
                      isStart
                        ? "fill-neo-green"
                        : isEnd
                          ? "fill-neo-red"
                          : "fill-neo-white"
                    }
                    stroke="black"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
            <AvatarPin
              avatarId={player1AvatarId}
              color="#54a0ff"
              x={player1Coords[0]}
              y={player1Coords[1]}
              isActive={currentPlayer === 1}
            />
            <AvatarPin
              avatarId={player2AvatarId}
              color="#FF4D4D"
              x={player2Coords[0]}
              y={player2Coords[1]}
              isActive={currentPlayer === 2}
            />
          </svg>
        </div>

        <div className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-neo-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.4em]">
              Current leg
            </p>
            <p className="text-lg font-bold">
              {player1Name} vs {player2Name}
            </p>
          </div>
          <p className="text-sm font-bold uppercase">
            Answer correctly to advance.
          </p>
        </div>
      </div>
    </div>
  );
};
