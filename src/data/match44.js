// STEP 1 - Real match data: CSK vs MI, Match 44, IPL 2026 (2 May 2026, MA Chidambaram Stadium, Chennai)
// Result: CSK won by 8 wickets with 11 balls left. MI 159/7 (20 ov), CSK 160/2 (18.1 ov).
//
// Sources used (scorecards and match reports): ESPNcricinfo full scorecard, CricTracker scorecard,
// cricket.com.au match report, PTI report (DT Next), Mykhel scorecard.
//
// RULES FOR THIS FILE
//  - Nothing is invented. If a detail was not confirmed, it is marked `unknown` or `inferred`, never guessed.
//  - Points are credited when a batter is dismissed (or at the end of the innings for not-outs), because free
//    sources give final batting lines and fall-of-wicket times, not every ball.

export const MATCH = {
  id: "ipl2026-m44",
  title: "CSK vs MI, Match 44, IPL 2026",
  venue: "MA Chidambaram Stadium, Chennai",
  date: "2026-05-02",
  toss: "Mumbai Indians won the toss and chose to bat",
  result: "Chennai Super Kings won by 8 wickets (11 balls left)",
  teams: {
    MI: { name: "Mumbai Indians", short: "MI", color: "#004BA0", text: "#ffffff", logo: "/logos/mi.png" },
    CSK: { name: "Chennai Super Kings", short: "CSK", color: "#F9CD05", text: "#14172b", logo: "/logos/csk.png" },
  },
};

// role is for display only and is NOT verified against Dream11 categories. Check before publishing.
export const PLAYERS = [
  // Mumbai Indians (players who batted or bowled in this match)
  { id: "jacks", name: "Will Jacks", team: "MI", role: "AR" },
  { id: "rickelton", name: "Ryan Rickelton", team: "MI", role: "WK" },
  { id: "suryakumar", name: "Suryakumar Yadav", team: "MI", role: "BAT" },
  { id: "tilak", name: "Tilak Varma", team: "MI", role: "BAT" },
  { id: "dhir", name: "Naman Dhir", team: "MI", role: "BAT" },
  { id: "hardik", name: "Hardik Pandya", team: "MI", role: "AR" },
  { id: "minz", name: "Robin Minz", team: "MI", role: "WK" },
  { id: "bumrah", name: "Jasprit Bumrah", team: "MI", role: "BOWL" },
  { id: "boult", name: "Trent Boult", team: "MI", role: "BOWL" },
  { id: "bhagat", name: "Krish Bhagat", team: "MI", role: "BOWL" },
  { id: "ghazanfar", name: "AM Ghazanfar", team: "MI", role: "BOWL" },
  // Chennai Super Kings (12 listed on the scorecard, including the impact player)
  { id: "samson", name: "Sanju Samson", team: "CSK", role: "WK" },
  { id: "gaikwad", name: "Ruturaj Gaikwad", team: "CSK", role: "BAT" },
  { id: "urvil", name: "Urvil Patel", team: "CSK", role: "WK" },
  { id: "kartik", name: "Kartik Sharma", team: "CSK", role: "BAT" },
  { id: "brevis", name: "Dewald Brevis", team: "CSK", role: "BAT" },
  { id: "dube", name: "Shivam Dube", team: "CSK", role: "AR" },
  { id: "overton", name: "Jamie Overton", team: "CSK", role: "AR" },
  { id: "veer", name: "Prashant Veer", team: "CSK", role: "AR" },
  { id: "ghosh", name: "Ramakrishna Ghosh", team: "CSK", role: "BOWL" },
  { id: "noor", name: "Noor Ahmad", team: "CSK", role: "BOWL" },
  { id: "kamboj", name: "Anshul Kamboj", team: "CSK", role: "BOWL" },
  { id: "mukesh", name: "Mukesh Choudhary", team: "CSK", role: "BOWL" },
];

// Event shape matches the Step 2 engine:
//   bat: { id, r (runs), f (fours), s (sixes), balls, out }   wkt: { bowler, fielder, how }
// `over` is "overs.balls" as printed on the scorecard, or null when the source does not give it.
// `inferred: [...]` lists fields deduced from other confirmed facts (explained in `why`).
// `unknown: [...]` lists fields no source confirmed. The engine treats them as 0.
export const EVENTS = [
  {
    id: "mi-1", inn: 1, over: "1.2", score: "MI 1/1", title: "Wicket! Jacks goes early",
    text: "Will Jacks is out for 1 off 5 balls, caught by Ramakrishna Ghosh, bowled by Anshul Kamboj.",
    bat: { id: "jacks", r: 1, balls: 5, f: 0, s: 0, out: true },
    wkt: { bowler: "kamboj", fielder: "ghosh", how: "caught" },
  },
  {
    id: "mi-2", inn: 1, over: "6.4", score: "MI 59/2", title: "Wicket! Rickelton holes out",
    text: "Ryan Rickelton is out for 37 off 24 balls, caught by Urvil Patel, bowled by Noor Ahmad. He hit five sixes.",
    bat: { id: "rickelton", r: 37, balls: 24, f: 0, s: 5, out: true },
    wkt: { bowler: "noor", fielder: "urvil", how: "caught" },
  },
  {
    id: "mi-3", inn: 1, over: "10.4", score: "MI 99/3", title: "Wicket! Suryakumar falls",
    text: "Suryakumar Yadav is out for 21 off 12 balls.",
    bat: { id: "suryakumar", r: 21, balls: 12, f: 0, s: 0, out: true },
    wkt: { bowler: "ghosh", fielder: null, how: "caught" },
    inferred: ["bowler"],
    unknown: ["f", "s", "fielder", "how"],
    why: "Ghosh finished 1/24. Kamboj (3), Noor (2) and Overton (1) account for the other six wickets, so Ghosh took this one.",
  },
  {
    id: "mi-4", inn: 1, over: "12.5", score: "MI 109/4", title: "Wicket! Tilak Varma out",
    text: "Tilak Varma is out for 5 off 8 balls, caught by Ruturaj Gaikwad, bowled by Noor Ahmad.",
    bat: { id: "tilak", r: 5, balls: 8, f: 0, s: 0, out: true },
    wkt: { bowler: "noor", fielder: "gaikwad", how: "caught" },
  },
  {
    id: "mi-5", inn: 1, over: "16.5", score: "MI 134/5", title: "Wicket! Dhir out for 57",
    text: "Naman Dhir is out for 57 off 37 balls, caught off Jamie Overton's bowling. He hit four fours and three sixes.",
    bat: { id: "dhir", r: 57, balls: 37, f: 4, s: 3, out: true },
    wkt: { bowler: "overton", fielder: null, how: "caught" },
    note: "The catch was taken by a substitute fielder (Sarfaraz Khan), so no catch points go to any listed player.",
  },
  {
    id: "mi-6", inn: 1, over: "17.2", score: "MI 139/6", title: "Wicket! Minz bowled",
    text: "Robin Minz is bowled by Anshul Kamboj for 5 off 3 balls.",
    bat: { id: "minz", r: 5, balls: 3, f: 1, s: 0, out: true },
    wkt: { bowler: "kamboj", fielder: null, how: "bowled" },
  },
  {
    id: "mi-7", inn: 1, over: "19.3", score: "MI 151/7", title: "Wicket! Hardik caught",
    text: "Hardik Pandya is out for 18 off 23 balls, caught by Dewald Brevis, bowled by Anshul Kamboj.",
    bat: { id: "hardik", r: 18, balls: 23, f: 2, s: 0, out: true },
    wkt: { bowler: "kamboj", fielder: "brevis", how: "caught" },
  },
  {
    id: "mi-end", inn: 1, over: "20.0", score: "MI 159/7", title: "Innings break",
    text: "Mumbai Indians finish on 159/7. Chennai Super Kings need 160 to win. Anshul Kamboj took 3/32 and Noor Ahmad 2/26.",
  },

  // CSK chase. Final batting lines are confirmed; the exact overs of the first two wickets were not found.
  {
    id: "csk-1", inn: 2, over: null, score: null, title: "Wicket! Bumrah removes Samson",
    text: "Sanju Samson is out for 11 off 9 balls, caught by Ryan Rickelton, bowled by Jasprit Bumrah.",
    bat: { id: "samson", r: 11, balls: 9, f: 2, s: 0, out: true },
    wkt: { bowler: "bumrah", fielder: "rickelton", how: "caught" },
    unknown: ["over", "score"],
    why: "Reports say Samson fell early in the chase. No source gave the over.",
  },
  {
    id: "csk-2", inn: 2, over: null, score: null, title: "Wicket! Urvil Patel bowled",
    text: "Urvil Patel is bowled by AM Ghazanfar for 24 off 12 balls. He hit two fours and two sixes.",
    bat: { id: "urvil", r: 24, balls: 12, f: 2, s: 2, out: true },
    wkt: { bowler: "ghazanfar", fielder: null, how: "bowled" },
    unknown: ["over", "score"],
    why: "Patel fell after Krish Bhagat's expensive over. No source gave the over.",
  },
  {
    id: "csk-end", inn: 2, over: "18.1", score: "CSK 160/2", title: "Chennai win by 8 wickets",
    text: "Ruturaj Gaikwad (67 not out off 48) and Kartik Sharma (54 not out off 40) finish the chase. Chennai Super Kings win by 8 wickets with 11 balls left.",
    bat: [
      { id: "gaikwad", r: 67, balls: 48, f: 5, s: 2, out: false },
      { id: "kartik", r: 54, balls: 40, f: 4, s: 3, out: false },
    ],
    result: true,
  },
];

// Official figures, used by scripts/check-match.mjs to catch typos. Not shown in the app.
export const CHECKS = {
  mi: { runs: 159, wickets: 7, fowOvers: ["1.2", "6.4", "10.4", "12.5", "16.5", "17.2", "19.3"] },
  csk: { runs: 160, wickets: 2, extras: 4 },
  bowlerWickets: { kamboj: 3, noor: 2, ghosh: 1, overton: 1, bumrah: 1, ghazanfar: 1 },
};