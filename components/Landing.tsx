import React from 'react';
import type { GameMode } from '../types';

interface LandingProps {
  onSelectMode: (mode: GameMode) => void;
}

const cards: Array<{ mode: GameMode; title: string; description: string; highlights: string[]; cta: string }> = [
  {
    mode: 'local',
    title: 'Local Duel',
    description: 'Pass the device and sprint across the globe on a shared screen.',
    highlights: ['Fast setup', 'Zero latency', 'Perfect for parties'],
    cta: 'Play Side-by-Side',
  },
  {
    mode: 'online',
    title: 'Online Rooms',
    description: 'Spin up a private room, share the invite code, and race remotely.',
    highlights: ['Live rooms', 'Invite codes', 'Socket.IO sync'],
    cta: 'Create / Join Room',
  },
];

export const Landing: React.FC<LandingProps> = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center">
      <div className="w-full max-w-5xl mx-auto px-6 py-10">
        <div className="text-center space-y-4">
          <p className="text-sm uppercase tracking-[0.4em] text-sky-400">Race Around The World</p>
          <h1 className="text-4xl md:text-5xl font-bold">Choose how you want to race</h1>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            Lean into couch co-op or send a room code to challenge a friend anywhere on the planet.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-12">
          {cards.map((card) => (
            <button
              key={card.mode}
              onClick={() => onSelectMode(card.mode)}
              className="group text-left bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-sky-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">{card.title}</h2>
                <span className="text-sm uppercase tracking-widest text-slate-400">{card.mode === 'local' ? 'Offline' : 'Online'}</span>
              </div>
              <p className="mt-4 text-slate-300">{card.description}</p>
              <ul className="mt-6 space-y-2 text-sm text-slate-400">
                {card.highlights.map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                    {point}
                  </li>
                ))}
              </ul>
              <div className="mt-8 inline-flex items-center gap-2 text-sky-300 font-semibold">
                {card.cta}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
