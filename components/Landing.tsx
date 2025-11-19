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
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center space-y-6 mb-16">
          <p className="text-sm font-bold uppercase tracking-[0.4em] bg-neo-black text-neo-white inline-block px-2 py-1">Race Around The World</p>
          <h1 className="text-5xl md:text-7xl font-neo-display font-bold uppercase leading-none tracking-tighter">
            Choose Your<br />Race Mode
          </h1>
          <p className="text-xl font-neo-body max-w-2xl mx-auto border-2 border-neo-black p-4 bg-neo-white shadow-neo-sm">
            Lean into couch co-op or send a room code to challenge a friend anywhere on the planet.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {cards.map((card) => (
            <button
              key={card.mode}
              onClick={() => onSelectMode(card.mode)}
              className="group text-left neo-card hover:bg-neo-blue hover:text-neo-white transition-all relative top-0 hover:-top-1 p-8"
            >
              <div className="flex items-center justify-between mb-4 border-b-4 border-neo-black pb-2 group-hover:border-neo-white">
                <h2 className="text-3xl font-neo-display font-bold uppercase">{card.title}</h2>
                <span className="text-xs font-bold uppercase tracking-widest bg-neo-black text-neo-white px-2 py-1 group-hover:bg-neo-white group-hover:text-neo-black border-2 border-transparent group-hover:border-neo-black">
                  {card.mode === 'local' ? 'Offline' : 'Online'}
                </span>
              </div>
              <p className="mb-6 font-neo-body text-lg leading-relaxed">{card.description}</p>
              <ul className="space-y-3 mb-8 font-neo-body text-sm">
                {card.highlights.map((point) => (
                  <li key={point} className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-neo-black group-hover:bg-neo-white border-2 border-neo-black group-hover:border-neo-white"></span>
                    {point}
                  </li>
                ))}
              </ul>
              <div className="inline-flex items-center gap-2 font-bold uppercase tracking-wider border-b-2 border-neo-black group-hover:border-neo-white pb-1">
                {card.cta}
                <span className="group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
