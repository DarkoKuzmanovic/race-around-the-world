export interface Avatar {
  id: string;
  name: string;
  path: string;
  gender: "male" | "female";
  description: string;
}

export const AVATARS: Avatar[] = [
  // Female avatars
  {
    id: "female1",
    name: "Explorer",
    path: "/resources/avatars/female1.png",
    gender: "female",
    description: "Seasoned world traveler",
  },
  {
    id: "female2",
    name: "Pilot",
    path: "/resources/avatars/female2.png",
    gender: "female",
    description: "Flying across the globe",
  },
  {
    id: "female3",
    name: "Captain",
    path: "/resources/avatars/female3.png",
    gender: "female",
    description: "Sailing the seven seas",
  },
  {
    id: "female4",
    name: "Astronaut",
    path: "/resources/avatars/female4.png",
    gender: "female",
    description: "Reaching for the stars",
  },
  {
    id: "female5",
    name: "Photographer",
    path: "/resources/avatars/female5.png",
    gender: "female",
    description: "Capturing beautiful moments",
  },
  {
    id: "female6",
    name: "Artist",
    path: "/resources/avatars/female6.png",
    gender: "female",
    description: "Creating inspired works",
  },
  // Male avatars
  {
    id: "male1",
    name: "Explorer",
    path: "/resources/avatars/male1.png",
    gender: "male",
    description: "Seasoned world traveler",
  },
  {
    id: "male2",
    name: "Pilot",
    path: "/resources/avatars/male2.png",
    gender: "male",
    description: "Flying across the globe",
  },
  {
    id: "male3",
    name: "Captain",
    path: "/resources/avatars/male3.png",
    gender: "male",
    description: "Sailing the seven seas",
  },
  {
    id: "male4",
    name: "Astronaut",
    path: "/resources/avatars/male4.png",
    gender: "male",
    description: "Reaching for the stars",
  },
  {
    id: "male5",
    name: "Photographer",
    path: "/resources/avatars/male5.png",
    gender: "male",
    description: "Capturing beautiful moments",
  },
  {
    id: "male6",
    name: "Artist",
    path: "/resources/avatars/male6.png",
    gender: "male",
    description: "Creating inspired works",
  },
];

export const getAvatarById = (id: string): Avatar | undefined => {
  return AVATARS.find((avatar) => avatar.id === id);
};

export const getAvatarsByGender = (gender: "male" | "female"): Avatar[] => {
  return AVATARS.filter((avatar) => avatar.gender === gender);
};

export const getRandomAvatar = (gender?: "male" | "female"): Avatar => {
  const availableAvatars = gender ? getAvatarsByGender(gender) : AVATARS;
  return availableAvatars[Math.floor(Math.random() * availableAvatars.length)];
};
