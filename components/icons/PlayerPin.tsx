
import React from 'react';

interface PlayerPinProps {
  color: string;
}

export const PlayerPin: React.FC<PlayerPinProps> = ({ color }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="28"
    height="28"
    fill={color}
    stroke="#FFF"
    strokeWidth="1.5"
    style={{ filter: `drop-shadow(0 2px 2px rgba(0,0,0,0.5))` }}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
    />
  </svg>
);
