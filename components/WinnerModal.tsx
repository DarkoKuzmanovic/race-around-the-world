import React from "react";

interface WinnerModalProps {
  winner: string;
  onPlayAgain: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  onPlayAgain,
}) => {
  return (
    <div className="neo-modal">
      <div className="neo-modal-content text-center">
        <h2 className="text-5xl font-neo-display font-bold uppercase mb-6 bg-neo-yellow border-2 border-neo-black p-2 inline-block shadow-neo-sm transform -rotate-2">
          Congratulations!
        </h2>
        <p className="text-2xl font-bold mb-8 font-neo-body">
          <span className="bg-neo-black text-neo-white px-2">{winner}</span> has
          won the race!
        </p>
        <button
          onClick={onPlayAgain}
          className="bg-neo-green border-4 border-neo-black shadow-neo-lg w-full py-6 text-3xl font-neo-display font-bold uppercase tracking-wider transition-all transform hover:scale-105 hover:bg-neo-black hover:text-neo-green active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
        >
          PLAY AGAIN
        </button>
      </div>
    </div>
  );
};
