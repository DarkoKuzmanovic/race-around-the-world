
import React from 'react';

interface ReadyModalProps {
  playerName: string;
  locationName: string;
  onReady: () => void;
}

export const TurnCountdownModal: React.FC<ReadyModalProps> = ({ playerName, locationName, onReady }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 text-center transform transition-all animate-fade-in-up">
        <h2 className="text-3xl font-bold text-white mb-2">
          {playerName}'s Turn!
        </h2>
        <p className="text-lg text-gray-300 mb-8">
          Your location: <span className="font-semibold text-blue-300">{locationName}</span>
        </p>
        <button
          onClick={onReady}
          className="w-full bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-lg text-lg transform hover:scale-105 transition-transform duration-300"
        >
          Ready for Question
        </button>
      </div>
    </div>
  );
};
