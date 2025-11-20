import React from "react";
import { AVATARS } from "../../data/avatars";

interface AvatarPinProps {
  avatarId: string;
  color: string;
  x?: number;
  y?: number;
  isActive?: boolean;
}

export const AvatarPin: React.FC<AvatarPinProps> = ({ avatarId, color, x = 0, y = 0, isActive = false }) => {
  const avatar = AVATARS.find((avatar) => avatar.id === avatarId);

  return (
    <g
      style={{
        transform: `translate(${x}px, ${y}px) scale(${isActive ? 1.2 : 1})`,
        filter: isActive ? "drop-shadow(0 4px 6px rgba(0,0,0,0.5))" : "drop-shadow(0 2px 2px rgba(0,0,0,0.3))",
        transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)", // Bouncy effect
        transformOrigin: "0 0", // Ensure we transform from the point we translate to
      }}
    >
      <circle r="18" fill="white" stroke={color} strokeWidth="3" />
      <circle r="16" fill="white" stroke={color} strokeWidth="2" />
      <defs>
        <clipPath id={`avatar-clip-${avatarId}`}>
          <circle r="14" />
        </clipPath>
      </defs>
      {avatar ? (
        <image href={avatar.path} x="-14" y="-14" width="28" height="28" clipPath={`url(#avatar-clip-${avatarId})`} />
      ) : (
        <circle r="14" fill="#f0f0f0" stroke="#333" strokeWidth="1" />
      )}
    </g>
  );
};
