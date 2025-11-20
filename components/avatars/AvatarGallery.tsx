import React, { useState, useRef, useEffect } from "react";
import {
  Avatar,
  AVATARS,
  getAvatarsByGender,
  getRandomAvatar,
} from "../../data/avatars";

interface AvatarGalleryProps {
  selectedAvatarId?: string;
  onAvatarSelect: (avatarId: string) => void;
  title?: string;
  showGender?: boolean;
  defaultGender?: "male" | "female";
}

export const AvatarGallery: React.FC<AvatarGalleryProps> = ({
  selectedAvatarId,
  onAvatarSelect,
  title = "Choose your avatar",
  showGender = true,
  defaultGender = "male",
}) => {
  const [gender, setGender] = useState<"male" | "female">(defaultGender);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const genderAvatars = getAvatarsByGender(gender);
  const selectedAvatar = genderAvatars.find(
    (avatar) => avatar.id === selectedAvatarId,
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleGenderChange = (newGender: "male" | "female") => {
    setGender(newGender);
    // Auto-select a random avatar of the new gender
    const randomAvatar = getRandomAvatar(newGender);
    onAvatarSelect(randomAvatar.id);
  };

  return (
    <div className="neo-card p-4 w-full min-h-[400px]">
      <h3 className="text-xl font-bold mb-4 text-center uppercase tracking-wider">
        {title}
      </h3>

      {showGender && (
        <div className="mb-4">
          <label className="block text-sm font-bold uppercase mb-2">
            Gender
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleGenderChange("male")}
              className={`px-4 py-2 font-bold uppercase border-2 border-neo-black ${
                gender === "male"
                  ? "bg-neo-black text-neo-white"
                  : "bg-neo-white text-neo-black"
              }`}
            >
              Male
            </button>
            <button
              onClick={() => handleGenderChange("female")}
              className={`px-4 py-2 font-bold uppercase border-2 border-neo-black ${
                gender === "female"
                  ? "bg-neo-black text-neo-white"
                  : "bg-neo-white text-neo-black"
              }`}
            >
              Female
            </button>
          </div>
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-bold uppercase mb-2">
          Select Avatar
        </label>
        <div
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="neo-input flex items-center justify-between cursor-pointer h-16 px-3"
        >
          <div className="flex items-center gap-3">
            {selectedAvatar && (
              <img
                src={selectedAvatar.path}
                alt={selectedAvatar.name}
                className="w-10 h-10 object-cover border-2 border-neo-black rounded-full"
              />
            )}
            <span className="font-bold">
              {selectedAvatar ? selectedAvatar.name : "Select an avatar"}
            </span>
          </div>
          <span className="text-xl font-bold">
            {isDropdownOpen ? "▲" : "▼"}
          </span>
        </div>

        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 neo-card border-2 border-neo-black bg-neo-white max-h-48 overflow-y-auto">
            {genderAvatars.map((avatar) => (
              <div
                key={avatar.id}
                onClick={() => {
                  onAvatarSelect(avatar.id);
                  setIsDropdownOpen(false);
                }}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-neo-blue/20 ${
                  selectedAvatarId === avatar.id ? "bg-neo-yellow" : ""
                }`}
              >
                <img
                  src={avatar.path}
                  alt={avatar.name}
                  className="w-10 h-10 object-cover border-2 border-neo-black rounded-full"
                />
                <div>
                  <div className="font-bold">{avatar.name}</div>
                  <div className="text-xs text-gray-600">
                    {avatar.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface AvatarDisplayProps {
  avatarId: string;
  size?: "small" | "medium" | "large";
  showName?: boolean;
  className?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarId,
  size = "medium",
  showName = false,
  className = "",
}) => {
  const [avatar, setAvatar] = useState<Avatar | null>(null);

  useEffect(() => {
    // Find the avatar by ID
    const allAvatars = [
      ...getAvatarsByGender("male"),
      ...getAvatarsByGender("female"),
    ];
    const foundAvatar = allAvatars.find((avatar) => avatar.id === avatarId);
    setAvatar(foundAvatar || null);
  }, [avatarId]);

  if (!avatar) {
    return <div className={className}>?</div>;
  }

  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-12 h-12",
    large: "w-16 h-16",
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        className={`${sizeClasses[size]} ${
          size === "small" ? "" : "mb-1"
        } relative`}
      >
        <img
          src={avatar.path}
          alt={avatar.name}
          className={`w-full h-full object-cover border-2 border-neo-black rounded-full ${
            size === "large" ? "border-4" : ""
          }`}
        />
      </div>
      {showName && (
        <div className="text-xs font-bold uppercase tracking-wider">
          {avatar.name}
        </div>
      )}
    </div>
  );
};
