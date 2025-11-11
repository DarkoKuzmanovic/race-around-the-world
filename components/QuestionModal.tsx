
import React, { useState, useEffect } from 'react';
import { TriviaQuestion } from '../types';

interface QuestionModalProps {
  question: TriviaQuestion;
  locationName: string;
  onAnswer: (isCorrect: boolean) => void;
  onGetMoreInfo: (question: string, answer: string) => Promise<void>;
  moreInfo: string | null;
  isMoreInfoLoading: boolean;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({ 
  question, 
  locationName, 
  onAnswer,
  onGetMoreInfo,
  moreInfo,
  isMoreInfoLoading
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showMoreInfoButton, setShowMoreInfoButton] = useState(false);

  const isCorrect = selectedAnswer === question.correctAnswer;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showResult && isCorrect) {
      setShowMoreInfoButton(true);
      timer = setTimeout(() => {
        setShowMoreInfoButton(false);
      }, 5000); // Button is visible for 5 seconds
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showResult, isCorrect]);


  const handleSelectAnswer = (option: string) => {
    if (showResult) return;
    setSelectedAnswer(option);
    setShowResult(true);
  };

  const handleMoreInfoClick = () => {
    setShowMoreInfoButton(false);
    onGetMoreInfo(question.question, question.correctAnswer);
  }

  const getButtonClass = (option: string) => {
    if (!showResult) {
      return 'bg-gray-700 hover:bg-gray-600';
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl p-8 transform transition-all animate-fade-in-up">
        <h2 className="text-lg font-semibold text-blue-300 mb-1">Question for {locationName}</h2>
        <p className="text-2xl font-bold mb-6">{question.question}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              disabled={showResult}
              onClick={() => handleSelectAnswer(option)}
              className={`p-4 rounded-lg text-left text-lg transition-all duration-300 ${getButtonClass(option)} ${!showResult ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {option}
            </button>
          ))}
        </div>

        {showResult && (
          <div className="mt-8 text-center space-y-4 transition-opacity duration-500">
            <div>
              <h3 className={`text-3xl font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect!'}
              </h3>
              {!isCorrect && <p className="text-gray-300 mt-2">The correct answer was: {question.correctAnswer}</p>}
            </div>
            
            <div className="min-h-[80px]">
              {showMoreInfoButton && (
                <button 
                  onClick={handleMoreInfoClick}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Learn More
                </button>
              )}
              {isMoreInfoLoading && (
                  <div className="text-gray-300 animate-pulse">Fetching interesting facts...</div>
              )}
              {moreInfo && (
                  <p className="text-gray-300 bg-gray-900/50 p-3 rounded-lg">{moreInfo}</p>
              )}
            </div>
            
            <button 
                onClick={() => onAnswer(isCorrect)}
                className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-teal-400 hover:from-blue-600 hover:to-teal-500 text-white font-bold py-3 px-6 rounded-lg text-lg transform hover:scale-105 transition-transform duration-300"
            >
                Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
