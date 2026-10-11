// Step 4 test: calls the backend function with a hand-written example, using your real keys.
// Run: node --env-file=.env.local scripts/try-api.mjs        (banter)
//  or: node --env-file=.env.local scripts/try-api.mjs calm   (calm analyst)
import handler from "../api/commentary.js";

const body = {
  mode: "event",
  mood: process.argv[2] === "calm" ? "calm" : "banter",
  event: { over: "6.4", score: "MI 59/2", title: "Wicket! Rickelton holes out", text: "Ryan Rickelton, 37 off 24 with five sixes, is caught by Urvil Patel at deep midwicket off Noor Ahmad.", result: false },
  fan: {
    team: "MI Paltan",
    captain: "Ryan Rickelton",
    vice: "Naman Dhir",
    impacts: [{ name: "Ryan Rickelton", multiplier: 2, change: 102, total: 102 }],
    total: 127,
    rivalTeam: "Yellow Army",
    rivalTotal: 66,
  },
};

const res = {
  code: 200,
  setHeader() {},
  status(c) { this.code = c; return this; },
  json(o) { console.log("HTTP", this.code, o); },
};
await handler({ method: "POST", body, headers: {}, socket: {} }, res);
