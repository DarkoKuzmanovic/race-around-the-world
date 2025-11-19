import React, { useEffect, useMemo, useState } from 'react';
import { LOCATIONS } from '../constants';
import type { LobbyPlayer, Location } from '../types';

interface OnlineLobbyProps {
  isConnected: boolean;
  roomCode: string | null;
  playerRole: 'host' | 'guest' | null;
  players: LobbyPlayer[];
  statusMessage: string | null;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
  onLeaveRoom: () => void;
  onStartGame: (start: Location, end: Location) => void;
  isLaunching: boolean;
  onBackToLanding: () => void;
}

const findLocationByName = (name: string): Location => {
  return LOCATIONS.find((loc) => loc.name === name) ?? LOCATIONS[0];
};

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({
  isConnected,
  roomCode,
  playerRole,
  players,
  statusMessage,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onStartGame,
  isLaunching,
  onBackToLanding,
}) => {
  const [hostName, setHostName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [startLocation, setStartLocation] = useState(LOCATIONS[0].name);
  const [endLocation, setEndLocation] = useState(LOCATIONS[LOCATIONS.length - 1].name);
  const [formError, setFormError] = useState<string | null>(null);

  const canLaunch = useMemo(() => {
    if (playerRole !== 'host') return false;
    if (!roomCode) return false;
    if (players.length < 2) return false;
    return startLocation !== endLocation;
  }, [playerRole, roomCode, players.length, startLocation, endLocation]);

  const handleCreate = () => {
    if (!hostName.trim()) {
      setFormError('Pick a display name before creating a room.');
      return;
    }
    setFormError(null);
    onCreateRoom(hostName.trim());
  };

  const handleJoin = () => {
    if (!joinCode.trim() || !joinName.trim()) {
      setFormError('Enter both the invite code and your display name.');
      return;
    }
    setFormError(null);
    onJoinRoom(joinCode.trim().toUpperCase(), joinName.trim());
  };

  const handleLaunch = () => {
    if (!canLaunch) {
      setFormError('Select a unique start and destination.');
      return;
    }
    const start = findLocationByName(startLocation);
    const end = findLocationByName(endLocation);
    onStartGame(start, end);
  };

  useEffect(() => {
    if (!roomCode) {
      setStartLocation(LOCATIONS[0].name);
      setEndLocation(LOCATIONS[LOCATIONS.length - 1].name);
    }
  }, [roomCode]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <button
            onClick={onBackToLanding}
            className="text-sm font-bold uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
          >
            ← Change mode
          </button>
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.4em] bg-neo-black text-neo-white inline-block px-2 py-1">Online Rooms</p>
            <h1 className="text-4xl font-neo-display font-bold uppercase mt-2">Challenge a friend</h1>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold uppercase border-2 border-neo-black px-3 py-1 bg-neo-white shadow-neo-sm">
            <span className={`w-3 h-3 border-2 border-neo-black ${isConnected ? 'bg-neo-green' : 'bg-neo-red'}`}></span>
            {isConnected ? 'Live' : 'Connecting...'}
          </div>
        </div>

        {!isConnected && (
          <div className="mb-8 bg-neo-yellow border-4 border-neo-black p-4 text-center shadow-neo-sm animate-pulse">
            <p className="font-bold uppercase text-neo-black text-lg">⚠️ Server Disconnected</p>
            <p className="text-sm font-neo-body mt-2 font-bold">
              Multiplayer requires the backend server.
            </p>
            <p className="text-xs mt-2">
              Run <code className="bg-neo-black text-neo-white px-2 py-1 font-mono">npm run dev:full</code> to start both.
            </p>
          </div>
        )}

        {!roomCode && (
          <div className="grid gap-8 md:grid-cols-2">
            <div className="neo-card relative">
              <div className="absolute -top-3 -left-3 bg-neo-blue border-2 border-neo-black px-3 py-1 font-bold uppercase transform -rotate-2 shadow-neo-sm text-neo-white">
                Host
              </div>
              <h2 className="text-2xl font-neo-display font-bold uppercase mt-4">Create a room</h2>
              <p className="font-neo-body text-sm mt-2 mb-6 border-b-2 border-neo-black pb-4">Share the invite code with a friend.</p>

              <label className="block text-sm font-bold uppercase mb-2">Display name</label>
              <input
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Amelia"
                className="neo-input mb-6"
              />
              <button
                onClick={handleCreate}
                disabled={!isConnected}
                className={`neo-btn neo-btn-primary w-full ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isConnected ? 'Create room' : 'Connecting...'}
              </button>
            </div>

            <div className="neo-card relative">
              <div className="absolute -top-3 -right-3 bg-neo-red border-2 border-neo-black px-3 py-1 font-bold uppercase transform rotate-2 shadow-neo-sm text-neo-white">
                Join
              </div>
              <h2 className="text-2xl font-neo-display font-bold uppercase mt-4">Join with code</h2>
              <p className="font-neo-body text-sm mt-2 mb-6 border-b-2 border-neo-black pb-4">Enter the 5-character code.</p>

              <label className="block text-sm font-bold uppercase mb-2">Invite code</label>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCDE"
                className="neo-input mb-4 uppercase tracking-widest font-mono"
              />
              <label className="block text-sm font-bold uppercase mb-2">Display name</label>
              <input
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Ibn Battuta"
                className="neo-input mb-6"
              />
              <button
                onClick={handleJoin}
                disabled={!isConnected}
                className={`neo-btn neo-btn-secondary w-full ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isConnected ? 'Join room' : 'Connecting...'}
              </button>
            </div>
          </div>
        )}

        {roomCode && (
          <div className="neo-card">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b-4 border-neo-black pb-6 mb-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest mb-2">Invite code</p>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-mono font-bold tracking-[0.2em] bg-neo-yellow border-2 border-neo-black px-4 py-2 shadow-neo-sm">{roomCode}</span>
                  <button
                    className="text-sm font-bold uppercase hover:underline decoration-2 underline-offset-4"
                    onClick={() => navigator.clipboard?.writeText(roomCode)}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <button
                onClick={onLeaveRoom}
                className="text-sm font-bold uppercase text-neo-red hover:bg-neo-red hover:text-neo-white border-2 border-neo-red px-4 py-2 transition-colors"
              >
                Leave room
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-8">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="border-2 border-neo-black p-4 flex items-center justify-between bg-neo-white shadow-neo-sm"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1 bg-neo-black text-neo-white inline-block px-1">{player.role === 'host' ? 'Host' : 'Guest'}</p>
                    <p className="text-xl font-bold">{player.name}</p>
                  </div>
                  <span className="text-xs font-mono border-2 border-neo-black px-2 py-1">#{player.id.slice(-4)}</span>
                </div>
              ))}
              {players.length < 2 && (
                <div className="border-2 border-dashed border-neo-black p-4 flex items-center justify-center font-bold uppercase text-gray-500 bg-gray-100">
                  Waiting for another player…
                </div>
              )}
            </div>

            {playerRole === 'host' ? (
              <div className="grid gap-6 md:grid-cols-2 mb-8 border-t-4 border-neo-black pt-6">
                <div>
                  <label className="block text-sm font-bold uppercase mb-2">Start city</label>
                  <div className="relative">
                    <select
                      value={startLocation}
                      onChange={(e) => setStartLocation(e.target.value)}
                      className="neo-input appearance-none cursor-pointer"
                    >
                      {LOCATIONS.map((loc) => (
                        <option key={loc.name} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-bold">▼</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase mb-2">Destination</label>
                  <div className="relative">
                    <select
                      value={endLocation}
                      onChange={(e) => setEndLocation(e.target.value)}
                      className="neo-input appearance-none cursor-pointer"
                    >
                      {LOCATIONS.map((loc) => (
                        <option key={loc.name} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none font-bold">▼</div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center font-bold uppercase animate-pulse border-t-4 border-neo-black pt-6">Waiting for the host to configure the route…</p>
            )}

            {playerRole === 'host' && (
              <button
                disabled={!canLaunch || isLaunching}
                onClick={handleLaunch}
                className={`w-full py-4 font-neo-display font-bold uppercase text-xl border-2 border-neo-black shadow-neo transition-all ${canLaunch
                  ? 'bg-neo-green text-neo-black hover:bg-neo-black hover:text-neo-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
              >
                {isLaunching ? 'Starting…' : 'Launch the race'}
              </button>
            )}
          </div>
        )}

        {(formError || statusMessage) && (
          <div className="mt-6 text-center font-bold uppercase bg-neo-red text-neo-white p-2 border-2 border-neo-black shadow-neo-sm mx-auto max-w-md">
            {formError || statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};
