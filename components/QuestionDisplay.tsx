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
      return `bg-neo-white hover:bg-neo-blue hover:text-neo-white ${!isInteractive ? 'opacity-50 cursor-not-allowed' : ''}`;
    }
    if (option === question.correctAnswer) {
      return 'bg-neo-green text-neo-black';
    }
    if (option === selectedAnswer && option !== question.correctAnswer) {
      return 'bg-neo-red text-neo-white';
    }
    return 'bg-neo-white opacity-50';
  };

  return (
    <div className="p-6 h-full flex flex-col justify-between bg-neo-white">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest mb-2 bg-neo-black text-neo-white inline-block px-2 py-1">Question for {locationName}</h2>
        <p className="text-3xl font-neo-display font-bold mb-6 leading-tight uppercase">{question.question}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option) => (
            <button
              key={option}
              disabled={!isInteractive || showResult}
              onClick={() => handleSelectAnswer(option)}
              className={`p-4 border-2 border-neo-black font-bold text-left text-lg transition-all duration-200 shadow-neo-sm ${getButtonClass(option)}`}
            >
              {option}
            </button>
          ))}
        </div>

        {!isInteractive && !showResult && (
          <p className="mt-4 text-sm font-bold uppercase animate-pulse">
            Waiting for {currentPlayerName} to answer…
          </p>
        )}
      </div>

      <div>
        {isInteractive && !showResult && (
          <div className="w-full border-2 border-neo-black h-4 mt-6 relative">
            <div
              className="bg-neo-black h-full transition-all duration-100 ease-linear"
              style={{ width: `${timerWidthPercent}%` }}
            />
          </div>
        )}

        {showResult && (
          <div className="mt-6 space-y-6">
            <div className="text-center border-2 border-neo-black p-4 bg-neo-yellow shadow-neo">
              <h3 className={`text-4xl font-neo-display font-bold uppercase ${isCorrect ? 'text-neo-black' : 'text-neo-red'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect!'}
              </h3>
              {!isCorrect && (
                <p className="font-bold mt-2">The correct answer was: <span className="underline decoration-4 decoration-neo-green">{question.correctAnswer}</span></p>
              )}
              {timedOut && !isCorrect && (
                <p className="font-bold uppercase text-sm mt-2">Time ran out!</p>
              )}
            </div>

            <div className="border-2 border-neo-black p-4 bg-neo-white shadow-neo-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 border-b-2 border-neo-black pb-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest bg-neo-black text-neo-white inline-block px-1">Learn more</p>
                  <p className="text-sm font-bold mt-1">
                    {moreInfo ? 'Shared fact for both players.' : isInteractive ? 'Reveal a bonus fact for the room.' : `${currentPlayerName} can reveal a bonus fact.`}
                  </p>
                </div>
                {isInteractive && showMoreInfoButton && !moreInfo && !isMoreInfoLoading && (
                  <button
                    onClick={handleMoreInfoClick}
                    className="neo-btn neo-btn-secondary text-sm py-2 px-4"
                  >
                    Learn More
                  </button>
                )}
              </div>
              <div className="min-h-[72px]">
                {isMoreInfoLoading && (
                  <p className="font-bold animate-pulse">Fetching interesting facts…</p>
                )}
                {!isMoreInfoLoading && moreInfo && (
                  <p className="font-neo-body text-sm leading-relaxed">{moreInfo}</p>
                )}
                {!isMoreInfoLoading && !moreInfo && (
                  <p className="text-sm italic text-gray-500">No bonus fact yet.</p>
                )}
              </div>
            </div>

            {isInteractive ? (
              <button
                onClick={() => onAnswer(isCorrect)}
                className="neo-btn neo-btn-primary w-full text-xl"
              >
                Continue
              </button>
            ) : (
              <p className="text-sm font-bold uppercase text-center animate-pulse">Waiting for {currentPlayerName} to continue…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
