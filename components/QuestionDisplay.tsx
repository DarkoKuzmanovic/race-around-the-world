import React, { useState, useEffect, useCallback } from 'react';
import { QuestionRevealState, TriviaQuestion } from '../types';

interface QuestionDisplayProps {
  question: TriviaQuestion;
  locationName: string;
  currentPlayerName: string;
  onAnswer: (isCorrect: boolean) => void;
  onRevealStateChange: (state: Omit<QuestionRevealState, 'questionId'>) => void;
  onGetMoreInfo: (question: string, answer: string) => Promise<void>;
  moreInfo: string | null;
  isMoreInfoLoading: boolean;
  isInteractive: boolean;
  revealedState: QuestionRevealState | null;
}

const TIMER_DURATION_MS = 15000;

type RevealSnapshot = Omit<QuestionRevealState, 'questionId'>;

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  locationName,
  currentPlayerName,
  onAnswer,
  onRevealStateChange,
  onGetMoreInfo,
  moreInfo,
  isMoreInfoLoading,
  isInteractive,
  revealedState,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [showMoreInfoButton, setShowMoreInfoButton] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION_MS);

  const isCorrect = Boolean(!timedOut && selectedAnswer && selectedAnswer === question.correctAnswer);

  const publishReveal = useCallback((snapshot: RevealSnapshot) => {
    setSelectedAnswer(snapshot.selectedAnswer);
    setShowResult(snapshot.showResult);
    setTimedOut(snapshot.timedOut);
    if (isInteractive) {
      onRevealStateChange(snapshot);
    }
  }, [isInteractive, onRevealStateChange]);

  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setTimedOut(false);
    setShowMoreInfoButton(false);
    setTimeLeft(TIMER_DURATION_MS);
  }, [question]);

  useEffect(() => {
    if (!revealedState || revealedState.questionId !== question.question) return;
    if (!revealedState.showResult) return;
    setSelectedAnswer(revealedState.selectedAnswer);
    setShowResult(true);
    setTimedOut(revealedState.timedOut);
  }, [revealedState, question.question]);

  useEffect(() => {
    if (!isInteractive || showResult) return;
    if (timeLeft <= 0) {
      publishReveal({ selectedAnswer: null, showResult: true, timedOut: true });
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 100));
    }, 100);

    return () => clearInterval(intervalId);
  }, [isInteractive, showResult, timeLeft, publishReveal]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isInteractive && showResult && isCorrect && !moreInfo) {
      setShowMoreInfoButton(true);
      timer = setTimeout(() => setShowMoreInfoButton(false), 5000);
    } else {
      setShowMoreInfoButton(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isInteractive, showResult, isCorrect, moreInfo]);

  const handleSelectAnswer = (option: string) => {
    if (!isInteractive || showResult) return;
    publishReveal({ selectedAnswer: option, showResult: true, timedOut: false });
  };

  const handleMoreInfoClick = () => {
    if (!isInteractive) return;
    setShowMoreInfoButton(false);
    onGetMoreInfo(question.question, question.correctAnswer);
  };

  const timerWidthPercent = Math.max(0, Math.min(100, (timeLeft / TIMER_DURATION_MS) * 100));

  const getButtonClass = (option: string) => {
    if (!showResult) {
      return `bg-gray-700 ${isInteractive ? 'hover:bg-gray-600' : 'opacity-40 cursor-not-allowed'}`;
    }
    if (option === question.correctAnswer) {
      return 'bg-green-600';
    }
    if (option === selectedAnswer && option !== question.correctAnswer) {
      return 'bg-red-600';
    }
    return 'bg-gray-700 opacity-50';
  };

  return (
    <div className="p-4 h-full flex flex-col justify-between">
      <div>
        <h2 className="text-md font-semibold text-blue-300 mb-1">Question for {locationName}</h2>
        <p className="text-2xl font-bold mb-4 leading-snug">{question.question}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {question.options.map((option) => (
            <button
              key={option}
              disabled={!isInteractive || showResult}
              onClick={() => handleSelectAnswer(option)}
              className={`p-3 rounded-lg text-left text-md transition-all duration-300 ${getButtonClass(option)}`}
            >
              {option}
            </button>
          ))}
        </div>

        {!isInteractive && !showResult && (
          <p className="mt-3 text-sm text-slate-400 italic">
            Waiting for {currentPlayerName} to answer…
          </p>
        )}
      </div>

      <div>
        {isInteractive && !showResult && (
          <div className="w-full bg-gray-700 rounded-full h-1.5 mt-4" aria-label="Time remaining">
            <div
              className="bg-gradient-to-r from-blue-400 to-teal-300 h-1.5 rounded-full transition-all duration-100 ease-linear"
              style={{ width: `${timerWidthPercent}%` }}
            />
          </div>
        )}

        {showResult && (
          <div className="mt-4 space-y-4">
            <div className="text-center space-y-1">
              <h3 className={`text-2xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect!'}
              </h3>
              {!isCorrect && (
                <p className="text-gray-300">The correct answer was: {question.correctAnswer}</p>
              )}
              {timedOut && !isCorrect && (
                <p className="text-gray-400 text-sm">Time ran out on this question.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Learn more</p>
                  <p className="text-sm text-slate-300">
                    {moreInfo ? 'Shared fact for both players.' : isInteractive ? 'Reveal a bonus fact for the room.' : `${currentPlayerName} can reveal a bonus fact.`}
                  </p>
                </div>
                {isInteractive && showMoreInfoButton && !moreInfo && !isMoreInfoLoading && (
                  <button
                    onClick={handleMoreInfoClick}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Learn More
                  </button>
                )}
              </div>
              <div className="min-h-[72px] rounded-xl border border-slate-800/60 bg-slate-950/50 p-3 text-left">
                {isMoreInfoLoading && (
                  <p className="text-gray-300 animate-pulse text-sm">Fetching interesting facts…</p>
                )}
                {!isMoreInfoLoading && moreInfo && (
                  <p className="text-sm text-slate-200 leading-relaxed">{moreInfo}</p>
                )}
                {!isMoreInfoLoading && !moreInfo && (
                  <p className="text-sm text-slate-500 italic">No bonus fact yet.</p>
                )}
              </div>
            </div>

            {isInteractive ? (
              <button
                onClick={() => onAnswer(isCorrect)}
                className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-white font-bold py-2 px-5 rounded-lg text-lg transform hover:scale-105 transition-transform duration-300"
              >
                Continue
              </button>
            ) : (
              <p className="text-sm text-slate-400 text-center italic">Waiting for {currentPlayerName} to continue…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
