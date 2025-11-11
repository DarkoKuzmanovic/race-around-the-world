import React from 'react';

interface WinnerModalProps {
  winner: string;
  onPlayAgain: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({ winner, onPlayAgain }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-8 text-center transform transition-all animate-fade-in-up">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400 mb-4">
          Congratulations!
        </h2>
        <p className="text-2xl text-white mb-8">
          {winner} has won the race!
        </p>
        <button
          onClick={onPlayAgain}
          className="w-full bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-lg text-lg transform hover:scale-105 transition-transform duration-300"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};
