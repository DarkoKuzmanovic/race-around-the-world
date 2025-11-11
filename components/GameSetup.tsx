
import React, { useState, useEffect } from 'react';
import { LOCATIONS } from '../constants';
import { Location } from '../types';

interface GameSetupProps {
  onStartGame: (start: Location, end: Location, player1Name: string, player2Name: string) => void;
  onBack?: () => void;
}

const generateRacePath = (start: Location, end: Location): Location[] => {
    const startIndex = LOCATIONS.findIndex(l => l.name === start.name);
    const endIndex = LOCATIONS.findIndex(l => l.name === end.name);
    if (startIndex === -1 || endIndex === -1) return [];

    if (startIndex <= endIndex) {
      return LOCATIONS.slice(startIndex, endIndex + 1);
    }
    return [...LOCATIONS.slice(startIndex), ...LOCATIONS.slice(0, endIndex + 1)];
};


export const GameSetup: React.FC<GameSetupProps> = ({ onStartGame, onBack }) => {
  const [startLocationName, setStartLocationName] = useState(LOCATIONS[0].name);
  const [endLocationName, setEndLocationName] = useState(LOCATIONS[LOCATIONS.length - 1].name);
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');
  const [error, setError] = useState<string | null>(null);
  const [pathLength, setPathLength] = useState(0);

  useEffect(() => {
    const start = LOCATIONS.find(l => l.name === startLocationName);
    const end = LOCATIONS.find(l => l.name === endLocationName);
    if (start && end && start.name !== end.name) {
      const path = generateRacePath(start, end);
      setPathLength(path.length - 1); // Number of questions is path length - 1
    } else {
      setPathLength(0);
    }
  }, [startLocationName, endLocationName]);

  const handleStart = () => {
    if (startLocationName === endLocationName) {
      setError('Start and destination cannot be the same.');
      return;
    }
     if (!player1Name.trim() || !player2Name.trim()) {
        setError('Player names cannot be empty.');
        return;
    }
    if (player1Name.trim().toLowerCase() === player2Name.trim().toLowerCase()) {
        setError('Player names must be different.');
        return;
    }
    setError(null);
    const start = LOCATIONS.find(l => l.name === startLocationName)!;
    const end = LOCATIONS.find(l => l.name === endLocationName)!;
    onStartGame(start, end, player1Name.trim(), player2Name.trim());
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      {onBack && (
        <button
          onClick={onBack}
          className="self-start mb-4 text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Change mode
        </button>
      )}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300 mb-2">
          Race Around The World
        </h1>
        <p className="text-lg text-gray-300">
          Enter your names, choose your route, and race by answering trivia!
        </p>
      </div>

      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label htmlFor="p1Name" className="block text-sm font-medium text-gray-300 mb-2">
                Player 1 Name
                </label>
                <input
                type="text"
                id="p1Name"
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value)}
                className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
            </div>
             <div>
                <label htmlFor="p2Name" className="block text-sm font-medium text-gray-300 mb-2">
                Player 2 Name
                </label>
                <input
                type="text"
                id="p2Name"
                value={player2Name}
                onChange={(e) => setPlayer2Name(e.target.value)}
                className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
            </div>
          </div>
          <div>
            <label htmlFor="start" className="block text-sm font-medium text-gray-300 mb-2">
              Start Location
            </label>
            <select
              id="start"
              value={startLocationName}
              onChange={(e) => setStartLocationName(e.target.value)}
              className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              {LOCATIONS.map(loc => (
                <option key={loc.name} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="end" className="block text-sm font-medium text-gray-300 mb-2">
              Destination
            </label>
            <select
              id="end"
              value={endLocationName}
              onChange={(e) => setEndLocationName(e.target.value)}
              className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              {LOCATIONS.map(loc => (
                <option key={loc.name} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        
        {pathLength > 0 && (
            <div className="text-center mt-6">
                <p className="text-lg text-gray-300">
                This race will have <span className="font-bold text-teal-300">{pathLength}</span> questions.
                </p>
            </div>
        )}

        <button
          onClick={handleStart}
          className="w-full mt-8 bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-lg text-lg transform hover:scale-105 transition-transform duration-300 shadow-lg"
        >
          Start Race!
        </button>
      </div>
    </div>
  );
};
