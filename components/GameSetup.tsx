import React, { useState, useEffect } from "react";
import { LOCATIONS } from "../constants";
import { Location } from "../types";
import { AvatarGallery } from "./avatars/AvatarGallery";
import { getRandomAvatar } from "../data/avatars";

interface GameSetupProps {
  onStartGame: (
    start: Location,
    end: Location,
    player1Name: string,
    player2Name: string,
    player1AvatarId: string,
    player2AvatarId: string,
  ) => void;
  onExit?: () => void;
}

const generateRacePath = (start: Location, end: Location): Location[] => {
  const startIndex = LOCATIONS.findIndex((l) => l.name === start.name);
  const endIndex = LOCATIONS.findIndex((l) => l.name === end.name);
  if (startIndex === -1 || endIndex === -1) return [];

  if (startIndex <= endIndex) {
    return LOCATIONS.slice(startIndex, endIndex + 1);
  }
  return [...LOCATIONS.slice(startIndex), ...LOCATIONS.slice(0, endIndex + 1)];
};

export const GameSetup: React.FC<GameSetupProps> = ({
  onStartGame,
  onExit,
}) => {
  const [startLocationName, setStartLocationName] = useState(LOCATIONS[0].name);
  const [endLocationName, setEndLocationName] = useState(
    LOCATIONS[LOCATIONS.length - 1].name,
  );
  const [player1Name, setPlayer1Name] = useState("Player 1");
  const [player2Name, setPlayer2Name] = useState("Player 2");
  const [player1AvatarId, setPlayer1AvatarId] = useState(
    getRandomAvatar("male").id,
  );
  const [player2AvatarId, setPlayer2AvatarId] = useState(
    getRandomAvatar("female").id,
  );
  const [error, setError] = useState<string | null>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    const start = LOCATIONS.find((l) => l.name === startLocationName);
    const end = LOCATIONS.find((l) => l.name === endLocationName);
    if (start && end && start.name !== end.name) {
      const path = generateRacePath(start, end);
      setPathLength(path.length - 1); // Number of questions is path length - 1
    } else {
      setPathLength(0);
    }
  }, [startLocationName, endLocationName]);

  const handleStart = () => {
    if (startLocationName === endLocationName) {
      setError("Start and destination cannot be the same.");
      return;
    }
    if (!player1Name.trim() || !player2Name.trim()) {
      setError("Player names cannot be empty.");
      return;
    }
    if (player1Name.trim().toLowerCase() === player2Name.trim().toLowerCase()) {
      setError("Player names must be different.");
      return;
    }
    setError(null);
    const start = LOCATIONS.find((l) => l.name === startLocationName)!;
    const end = LOCATIONS.find((l) => l.name === endLocationName)!;
    onStartGame(
      start,
      end,
      player1Name.trim(),
      player2Name.trim(),
      player1AvatarId,
      player2AvatarId,
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {onExit && (
        <button
          onClick={onExit}
          className="self-start mb-8 text-sm font-bold uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
        >
          ← Exit
        </button>
      )}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-5xl md:text-6xl font-neo-display font-bold uppercase tracking-tighter">
          Race Around
          <br />
          The World
        </h1>
        <p className="text-xl font-neo-body bg-neo-white border-2 border-neo-black p-2 inline-block shadow-neo-sm">
          Enter your names, choose your avatars, select your route, and race!
        </p>
      </div>

      <div className="neo-card w-full max-w-xl relative">
        <div className="absolute -top-3 -right-3 bg-neo-yellow border-2 border-neo-black px-3 py-1 font-bold uppercase transform rotate-3 shadow-neo-sm">
          Setup Race
        </div>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="p1Name"
                className="block text-sm font-bold uppercase mb-2 border-b-2 border-neo-black w-fit"
              >
                Player 1 Name
              </label>
              <input
                type="text"
                id="p1Name"
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value)}
                className="neo-input"
                placeholder="Enter Name"
              />
            </div>
            <div>
              <label
                htmlFor="p2Name"
                className="block text-sm font-bold uppercase mb-2 border-b-2 border-neo-black w-fit"
              >
                Player 2 Name
              </label>
              <input
                type="text"
                id="p2Name"
                value={player2Name}
                onChange={(e) => setPlayer2Name(e.target.value)}
                className="neo-input"
                placeholder="Enter Name"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="start"
                className="block text-sm font-bold uppercase mb-2 border-b-2 border-neo-black w-fit"
              >
                Start Location
              </label>
              <div className="relative">
                <select
                  id="start"
                  value={startLocationName}
                  onChange={(e) => setStartLocationName(e.target.value)}
                  className="neo-input appearance-none cursor-pointer"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-bold">
                  ▼
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="end"
                className="block text-sm font-bold uppercase mb-2 border-b-2 border-neo-black w-fit"
              >
                Destination
              </label>
              <div className="relative">
                <select
                  id="end"
                  value={endLocationName}
                  onChange={(e) => setEndLocationName(e.target.value)}
                  className="neo-input appearance-none cursor-pointer"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-bold">
                  ▼
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8"></div>

        <h2 className="text-2xl font-bold uppercase text-center mb-6">
          Select Your Avatars
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold uppercase mb-2 border-b-2 border-neo-black w-fit">
              Player 1 Avatar
            </label>
            <AvatarGallery
              selectedAvatarId={player1AvatarId}
              onAvatarSelect={setPlayer1AvatarId}
              title=""
              defaultGender="male"
            />
          </div>
          <div>
            <label className="block text-sm font-bold uppercase mb-2 border-b-2 border-neo-black w-fit">
              Player 2 Avatar
            </label>
            <AvatarGallery
              selectedAvatarId={player2AvatarId}
              onAvatarSelect={setPlayer2AvatarId}
              title=""
              defaultGender="female"
            />
          </div>
        </div>

        <div className="mt-8"></div>

        {error && (
          <div className="mt-6 bg-neo-red text-neo-white p-3 border-2 border-neo-black font-bold text-center shadow-neo-sm">
            {error}
          </div>
        )}

        {pathLength > 0 && (
          <div className="text-center mt-8 p-4 bg-neo-blue/20 border-2 border-neo-black border-dashed">
            <p className="text-lg font-neo-body">
              Race Length:{" "}
              <span className="font-bold text-2xl">{pathLength}</span> Questions
            </p>
          </div>
        )}

        <button
          onClick={handleStart}
          className="bg-neo-yellow border-4 border-neo-black shadow-neo-lg w-full mt-8 py-6 text-3xl font-neo-display font-bold uppercase tracking-wider transition-all transform hover:scale-105 hover:bg-neo-black hover:text-neo-yellow active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
        >
          START RACE!
        </button>
      </div>
    </div>
  );
};
