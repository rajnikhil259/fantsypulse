# Fantasy Pulse

**Scorecards tell you what happened. Fantasy Pulse tells you what it means for your fantasy team.**

A match companion for fantasy-cricket fans. It replays a real IPL match (CSK vs MI, Match 44, 2 May 2026, Chepauk) and, at every wicket, explains in short Hinglish what just happened to *your* team's points and where you stand against your rival.

## The fan problem

During a live match a fantasy player asks the same things again and again: *Is my captain doing well? Am I ahead of my friend? Where did those points come from? Should I worry?* A scorecard answers none of them.

## What it does

- **Pick your team:** one of four ready-made teams, or build your own XI from the 23 real players (11 players, at most 7 from one side, one captain, one vice-captain).
- **Pick your rival:** any ready-made team, or build the rival's XI yourself. This stands in for a friend in a private contest.
- **Replay the match:** real wickets and innings milestones, with real overs and batting lines, one event at a time.
- **Pulse messages:** after each event, an AI writes two short sentences in Hinglish (calm analyst or friends-group banter) about what it means for your points and the gap to your rival. A "Catch me up" button gives a short recap.
- **Receipts:** tap a chip like "Rickelton +102 C", or any player in your table, to see exactly where the points came from (37 runs + 10 for sixes + 4 for a 30-run bonus, then x2 for the captain).
- **Rival radar:** shows which players are driving the gap between you and your rival, using the same numbers.
- **Safe fallback:** if the AI is slow or down, each card shows a plain note built from the same numbers, so the demo never breaks.

## How it works

```
Real match data -> Points engine (plain code) -> Facts -> AI writes the words -> Screen
```

- **The AI never calculates anything.** The points engine (`src/engine.js`) computes every number, including captain and vice-captain multipliers, the lead and each receipt. The AI only turns those facts into a sentence.
- **Backend:** one serverless function, `api/commentary.js`. It tries Groq first and Gemini second. It cleans the input, caches repeat requests, and rate-limits each visitor. API keys stay on the server and never reach the browser.
- **Frontend:** React and Vite.

## Run it on your laptop

You need Node.js 20.6 or newer.

```bash
npm install
```

Create a file named `.env.local` in the project root (never upload it):

```
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-120b
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Then:

```bash
npm run dev
```

Open the link it prints (usually http://localhost:5173). `npm run dev` also runs the backend function locally, using your `.env.local`.

Free-tier model names change often. Check the model lists in the Groq and Google AI Studio consoles, and change `GROQ_MODEL` or `GEMINI_MODEL` if a name stops working.

## Deploy on Vercel

1. Push the project to a GitHub repository. Check that `.env.local` is **not** in the upload.
2. In Vercel, choose **Add New Project** and import the repository. Vite is detected automatically.
3. Open **Settings, Environment Variables** and add `GROQ_API_KEY`, `GROQ_MODEL`, `GEMINI_API_KEY` and `GEMINI_MODEL` with the same values as above.
4. Deploy, open the link, and press **Start the match replay**.

If you change an environment variable later, redeploy so it takes effect. Check Vercel's current free-plan terms yourself before relying on them.

## Project layout

```
api/
  commentary.js        backend: Groq, then Gemini, cache, rate limit
public/logos/          optional: mi.png and csk.png (a coloured badge shows if missing)
scripts/
  test-keys.mjs        checks that both API keys and model names work
  try-api.mjs          calls the backend once with a sample event
  check-engine.mjs     tests for the points engine, receipts and radar
  check-match.mjs      checks the match data against the scorecard totals
  show-examples.mjs    prints example receipts and the radar table
src/
  data/match44.js      the real match: players, events, overs, batting lines
  data/fanTeams.js     the four ready-made teams
  engine.js            scoring rules, captain multipliers, receipts, radar
  App.jsx              screen switching and team/rival choices
  Setup.jsx            team, rival and tone picker with the XI builder
  Match.jsx            scoreboard, controls, Pulse feed, points table
  Receipt.jsx          "where did these points come from"
  Radar.jsx            rival radar
  Badge.jsx            team logo or coloured badge
  styles.css
index.html
vite.config.js         also runs api/commentary.js during npm run dev
```

## Tests

```bash
npm test                              # points engine, receipts and radar
node scripts/check-match.mjs          # match data against scorecard totals
node --env-file=.env.local scripts/test-keys.mjs   # your keys and models
node --env-file=.env.local scripts/try-api.mjs     # one real AI message
```

## Honest limits

- **It is a replay, not a live feed.** Live data comes from licensed feeds. In production, Dream11's own feed would plug in where `match44.js` sits today.
- **Points land when a batter is dismissed or the innings ends.** Free public scorecards give final batting lines and fall-of-wicket times, not every ball.
- **Scoring rules are simplified.** They are inspired by fantasy apps but are not the official Dream11 points table.
- **Some details are unconfirmed.** Suryakumar Yadav's wicket bowler is inferred from bowling figures, and his boundaries, plus the exact overs of the two CSK wickets, were not in the sources. They are marked in `match44.js` and the app leaves them out rather than guess.
- **Roles (WK, BAT, AR, BOWL) are display labels** and are not checked against Dream11's categories.
- **AI wording varies.** The prompt and the structured scorecard record reduce mistakes a lot, but cannot rule them out.
- **The cache and rate limit live in server memory** and reset when the function restarts.

## Disclaimer

Unofficial fan project built for an assignment. Not affiliated with, endorsed by or sponsored by the IPL, the BCCI, Mumbai Indians, Chennai Super Kings or Dream11. Team and player names are used only to describe a public match. Scores come from public scorecards. Team logos are not included in this repository; add your own files to `public/logos/` if you use them, and check you have the right to do so.

## Ideas for what comes next

- Per-ball updates with plain code, and short rule-based lines for boundaries, filtered to the fan's team.
- A "what if I had picked a different captain" view.
- A match story at the end of the replay.
- Commentary-to-stats with speech recognition, using verified match data for the cards.
- A mini leaderboard across several teams.