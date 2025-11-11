import React, { useEffect, useState, useMemo } from 'react';
import { GameMode, Location, TriviaQuestion, QuestionRevealState } from '../types';
import { PlayerPin } from './icons/PlayerPin';
import { QuestionDisplay } from './QuestionDisplay';

declare const d3: any;
declare const topojson: any;

interface GameBoardProps {
  path: Location[];
  player1Position: number;
  player2Position: number;
  currentPlayer: number;
  player1Name: string;
  player2Name: string;
  currentQuestion: TriviaQuestion | null;
  questionReveal: QuestionRevealState | null;
  onReadyForQuestion: () => void;
  onAnswer: (isCorrect: boolean) => void;
  onRevealStateChange: (state: Omit<QuestionRevealState, 'questionId'>) => void;
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
    d3.json('https://unpkg.com/world-atlas@2/countries-110m.json').then((data: any) => {
      setGeoData(topojson.feature(data, data.objects.countries));
    });
  }, []);

  const projection = useMemo(() => d3.geoMercator().scale(130).translate([width / 2, height / 1.5]), []);
  const geoPathGenerator = useMemo(() => d3.geoPath().projection(projection), [projection]);

  const pathSegments = useMemo(() => {
    if (path.length < 2) return [];
    const lineGenerator = d3.line().curve(d3.curveCatmullRom.alpha(0.5));
    return path.slice(0, -1).map((loc, index) => {
      const next = path[index + 1];
      const interpolator = d3.geoInterpolate(loc.coordinates, next.coordinates);
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
    }).filter(Boolean);
  }, [path, projection]);

  const clampPosition = (position: number) => {
    if (path.length === 0) return 0;
    return Math.min(Math.max(position, 0), path.length - 1);
  };

  const safePlayer1Pos = clampPosition(player1Position);
  const safePlayer2Pos = clampPosition(player2Position);
  const currentTurnPlayerPosition = currentPlayer === 1 ? safePlayer1Pos : safePlayer2Pos;

  const fallbackCoordinates: [number, number] = path[0]?.coordinates ?? [0, 0];
  const projectCoordinates = (coordinates?: [number, number]): [number, number] => {
    const projected = coordinates ? projection(coordinates) : projection(fallbackCoordinates);
    if (!projected) {
      return projection(fallbackCoordinates) as [number, number];
    }
    return projected as [number, number];
  };

  const player1Coords = projectCoordinates(path[safePlayer1Pos]?.coordinates);
  const player2Coords = projectCoordinates(path[safePlayer2Pos]?.coordinates);

  const totalStops = Math.max(path.length - 1, 1);
  const progressFor = (position: number) => Math.min(100, (position / totalStops) * 100);

  const currentTurnPlayerName = currentPlayer === 1 ? player1Name : player2Name;
  const currentTurnLocationName = path[currentTurnPlayerPosition]?.name ?? 'Destination';

  const renderMap = () => {
    if (!geoData) {
      return <text x={width / 2} y={height / 2} fill="white" textAnchor="middle">Loading Map...</text>;
    }
    return (
      <g>
        {geoData.features.map((feature: any, i: number) => (
          <path key={i} d={geoPathGenerator(feature)} className="fill-gray-700 stroke-gray-800" />
        ))}
      </g>
    );
  };

  const playerCards = [
    {
      name: player1Name,
      color: 'from-blue-500 to-cyan-400',
      accent: 'bg-blue-500/10',
      position: safePlayer1Pos,
      location: path[safePlayer1Pos]?.name,
      progress: progressFor(safePlayer1Pos),
      isActive: currentPlayer === 1,
    },
    {
      name: player2Name,
      color: 'from-rose-500 to-orange-400',
      accent: 'bg-rose-500/10',
      position: safePlayer2Pos,
      location: path[safePlayer2Pos]?.name,
      progress: progressFor(safePlayer2Pos),
      isActive: currentPlayer === 2,
    },
  ];

  const gradientId = 'race-route-gradient';
  const glowId = 'race-route-glow';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-6xl bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur">
        <div className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {onExit && (
            <button onClick={onExit} className="text-sm text-slate-400 hover:text-white transition-colors w-fit">
              ← {gameMode === 'online' ? 'Leave room' : 'Change mode'}
            </button>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs uppercase tracking-[0.4em] bg-slate-800 border border-slate-700">
              {gameMode === 'online' ? 'Online room' : 'Local duel'}
            </span>
            {roomCode && (
              <span className="px-3 py-1 rounded-full text-xs bg-slate-800 border border-slate-700 font-mono tracking-[0.4em]">
                {roomCode}
              </span>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 grid gap-4 md:grid-cols-2">
          {playerCards.map((player) => (
            <div
              key={player.name}
              className={`rounded-2xl border ${
                player.isActive ? 'border-sky-500/70' : 'border-slate-800'
              } bg-slate-950/60 p-4 transition-colors`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-400">{player.isActive ? 'Taking off' : 'Cruising'}</p>
                  <p className="text-2xl font-semibold">{player.name}</p>
                </div>
                <div className={`w-10 h-10 rounded-full ${player.accent} border border-slate-700`}></div>
              </div>
              <p className="text-sm text-slate-400 mt-2">{player.location || 'On the move'}</p>
              <div className="h-1.5 bg-slate-800 rounded-full mt-3">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${player.color}`}
                  style={{ width: `${player.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border-y border-slate-800 relative">
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
            <div className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Next stop</p>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
                  {currentTurnLocationName}
                </h1>
                <p className="text-slate-300 mt-2">It&apos;s {currentTurnPlayerName}&apos;s turn. Tap below to draw a challenge.</p>
              </div>
              <button
                onClick={onReadyForQuestion}
                className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-white font-bold py-3 px-6 rounded-2xl text-md transform hover:scale-105 transition"
              >
                Get Question
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
            <defs>
              <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={width} y2={0}>
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
              <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {renderMap()}
            {pathSegments.map((segment: string, idx: number) => (
              <g key={`segment-${idx}`}>
                <path
                  d={segment}
                  fill="none"
                  stroke="rgba(15,23,42,0.6)"
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.45}
                />
                <path
                  d={segment}
                  fill="none"
                  stroke={`url(#${gradientId})`}
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#${glowId})`}
                  opacity={0.95}
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
                <circle
                  key={loc.name}
                  cx={cx}
                  cy={cy}
                  r={isStart || isEnd ? 6 : 4}
                  className={isStart ? 'fill-green-400' : isEnd ? 'fill-red-400' : 'fill-blue-400'}
                  stroke="white"
                  strokeWidth="1.5"
                />
              );
            })}
            <g transform={`translate(${player1Coords[0] - 14}, ${player1Coords[1] - 28})`}>
              <PlayerPin color="#3B82F6" />
            </g>
            <g transform={`translate(${player2Coords[0] - 14}, ${player2Coords[1] - 28})`}>
              <PlayerPin color="#F43F5E" />
            </g>
          </svg>
        </div>

        <div className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Current leg</p>
            <p className="text-lg text-slate-200">{player1Name} vs {player2Name}</p>
          </div>
          <p className="text-sm text-slate-400">Answer correctly to advance along the illuminated path.</p>
        </div>
      </div>
    </div>
  );
};
