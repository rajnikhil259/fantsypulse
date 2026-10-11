// Two preset fan teams built from players in the real match. Max 7 from one side, like fantasy apps.
export const PRESET_TEAMS = [
  {
    id: "paltan",
    name: "MI Paltan",
    tagline: "Backs Mumbai. Captain: Ryan Rickelton, vice: Naman Dhir.",
    players: ["rickelton", "dhir", "hardik", "suryakumar", "tilak", "bumrah", "ghazanfar", "samson", "noor", "overton", "gaikwad"],
    captain: "rickelton",
    vice: "dhir",
  },
  {
    id: "yellow",
    name: "Yellow Army",
    tagline: "Backs Chennai. Captain: Ruturaj Gaikwad, vice: Kartik Sharma.",
    players: ["gaikwad", "kartik", "urvil", "noor", "kamboj", "ghosh", "brevis", "hardik", "bumrah", "suryakumar", "minz"],
    captain: "gaikwad",
    vice: "kartik",
  },
  {
    id: "hitters",
    name: "Big Hitters",
    tagline: "All about sixes. Captain: Naman Dhir, vice: Ruturaj Gaikwad.",
    players: ["rickelton", "dhir", "suryakumar", "hardik", "jacks", "tilak", "gaikwad", "kartik", "urvil", "samson", "brevis"],
    captain: "dhir",
    vice: "gaikwad",
  },
  {
    id: "hunters",
    name: "Wicket Hunters",
    tagline: "Bowlers rule. Captain: Anshul Kamboj, vice: Noor Ahmad.",
    players: ["bumrah", "boult", "bhagat", "ghazanfar", "jacks", "minz", "samson", "kamboj", "noor", "ghosh", "overton"],
    captain: "kamboj",
    vice: "noor",
  },
];