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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 flex items-center">
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <button
            onClick={onBackToLanding}
            className="text-sm text-slate-400 hover:text-slate-100 transition-colors w-fit"
          >
            ← Change mode
          </button>
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-sky-400">Online Rooms</p>
            <h1 className="text-3xl md:text-4xl font-bold mt-1">Challenge a friend anywhere</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
            {isConnected ? 'Realtime link live' : 'Connecting...'}
          </div>
        </div>

        {!roomCode && (
          <div className="grid gap-6 md:grid-cols-2 mt-10">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-2xl font-semibold">Create a room</h2>
              <p className="text-slate-400 text-sm mt-2">Share the invite code with a single friend. Rooms hold two racers.</p>
              <label className="block text-sm text-slate-300 mt-5">Display name</label>
              <input
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Amelia"
                className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                onClick={handleCreate}
                className="mt-5 w-full bg-gradient-to-r from-sky-500 to-cyan-400 text-white font-semibold py-3 rounded-xl hover:from-sky-400 hover:to-cyan-300 transition-colors"
              >
                Create room
              </button>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-2xl font-semibold">Join with a code</h2>
              <p className="text-slate-400 text-sm mt-2">Paste the 5-character code your friend shares with you.</p>
              <label className="block text-sm text-slate-300 mt-5">Invite code</label>
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABCDE"
                className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl p-3 uppercase tracking-widest focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <label className="block text-sm text-slate-300 mt-4">Display name</label>
              <input
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Ibn Battuta"
                className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
              <button
                onClick={handleJoin}
                className="mt-5 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-xl hover:from-purple-400 hover:to-pink-400 transition-colors"
              >
                Join room
              </button>
            </div>
          </div>
        )}

        {roomCode && (
          <div className="mt-10 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-400">Invite code</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-3xl font-mono tracking-[0.4em]">{roomCode}</span>
                  <button
                    className="text-sm text-sky-300 hover:text-sky-200"
                    onClick={() => navigator.clipboard?.writeText(roomCode)}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <button
                onClick={onLeaveRoom}
                className="text-sm text-slate-400 hover:text-rose-300"
              >
                Leave room
              </button>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm uppercase tracking-widest text-slate-400">{player.role === 'host' ? 'Host' : 'Guest'}</p>
                    <p className="text-xl font-semibold">{player.name}</p>
                  </div>
                  <span className="text-xs text-slate-500">#{player.id.slice(-4)}</span>
                </div>
              ))}
              {players.length < 2 && (
                <div className="bg-slate-950/40 border border-dashed border-slate-700 rounded-xl p-4 flex items-center justify-center text-slate-500 text-sm">
                  Waiting for another player…
                </div>
              )}
            </div>

            {playerRole === 'host' ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm text-slate-300">Start city</label>
                  <select
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className="mt-2 w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-sky-500"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-300">Destination</label>
                  <select
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    className="mt-2 w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 focus:ring-2 focus:ring-sky-500"
                  >
                    {LOCATIONS.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <p className="mt-8 text-slate-400 text-sm">Waiting for the host to configure the route…</p>
            )}

            {playerRole === 'host' && (
              <button
                disabled={!canLaunch || isLaunching}
                onClick={handleLaunch}
                className={`mt-8 w-full py-4 rounded-xl font-semibold text-lg transition-colors ${
                  canLaunch
                    ? 'bg-gradient-to-r from-emerald-500 to-lime-400 text-slate-950'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isLaunching ? 'Starting…' : 'Launch the race'}
              </button>
            )}
          </div>
        )}

        {(formError || statusMessage) && (
          <div className="mt-6 text-center text-sm text-rose-300">
            {formError || statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};
