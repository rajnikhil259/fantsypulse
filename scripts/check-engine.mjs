// Sanity checks for the points engine on the real match data. Run: npm test
import assert from "node:assert/strict";
import { PLAYERS } from "../src/data/match44.js";
import { PRESET_TEAMS } from "../src/data/fanTeams.js";
import { SNAPSHOTS, teamTotal, teamImpacts, breakdown, pointsOf, receipt, eventReceipt, fullReceipt, radar, multiplier } from "../src/engine.js";

const [paltan, yellow] = PRESET_TEAMS;
const last = SNAPSHOTS.length - 1;
const pts = (id) => SNAPSHOTS[last].points[id];

// Hand-checked totals
assert.equal(pts("rickelton"), 59); // 37 runs + 10 (5 sixes) + 4 (30 bonus) + 8 (catch of Samson)
assert.equal(pts("dhir"), 75); // 57 + 4 (fours) + 6 (sixes) + 8 (fifty bonus)
assert.equal(pts("gaikwad"), 92); // 67 + 5 + 4 + 8 + 8 (catch of Tilak)
assert.equal(pts("kartik"), 72); // 54 + 4 + 6 + 8
assert.equal(pts("kamboj"), 83); // 3 wickets (75) + 8 for bowling Minz
assert.equal(pts("ghazanfar"), 33); // wicket + bowled bonus (Patel)
assert.equal(pts("urvil"), 38); // 24 + 2 + 4 + 8 (catch of Rickelton)
assert.equal(pts("boult"), 0);

// Captain doubles, vice is x1.5
const e2 = 1; // Rickelton's dismissal
const imp = teamImpacts(paltan, e2).find((i) => i.id === "rickelton");
assert.equal(imp.mult, 2);
assert.equal(imp.delta, 51 * 2); // 37 + 10 + 4 (30 bonus), doubled for captain
const vimp = teamImpacts(yellow, last).find((i) => i.id === "kartik");
assert.equal(vimp.mult, 1.5);
assert.equal(vimp.delta, 72 * 1.5);

// Per-event deltas add up to the final points for everyone
for (const p of PLAYERS) {
  const sum = SNAPSHOTS.reduce((s, snap) => s + snap.delta[p.id], 0);
  assert.equal(sum, pts(p.id), p.id);
}

// Preset teams: 11 players, max 7 per side, captain/vice are in the team and different
for (const t of PRESET_TEAMS) {
  assert.equal(t.players.length, 11);
  assert.equal(new Set(t.players).size, 11);
  assert.ok(t.players.includes(t.captain) && t.players.includes(t.vice) && t.captain !== t.vice);
  for (const code of ["MI", "CSK"]) assert.ok(t.players.filter((id) => PLAYERS.find((p) => p.id === id).team === code).length <= 7);
}

// Demo story: MI Paltan leads for most of the match, Yellow Army wins it on the last event
const lead = (i) => teamTotal(paltan, i) - teamTotal(yellow, i);
assert.ok(lead(last - 1) > 0 && lead(last) < 0);

// ---- Receipts: the parts must always add up to the points ----
for (const p of PLAYERS) {
  for (let i = 0; i < SNAPSHOTS.length; i++) {
    const st = SNAPSHOTS[i].stats[p.id];
    assert.equal(breakdown(st).reduce((t, x) => t + x.pts, 0), pointsOf(st), `${p.id} breakdown at ${i}`);
    assert.equal(receipt(paltan, p.id, -1, i).base, SNAPSHOTS[i].points[p.id], `${p.id} full receipt at ${i}`);
  }
  // Event-by-event receipts also add up to the final points
  const sum = SNAPSHOTS.reduce((t, _, i) => t + eventReceipt(yellow, p.id, i).base, 0);
  assert.equal(sum, pts(p.id), `${p.id} event receipts sum`);
}
// The +102 from the screenshot: 37 runs + 10 for sixes + 4 for passing 30 = 51, doubled for the captain
const rk = eventReceipt(paltan, "rickelton", 1);
assert.deepEqual(rk.parts.map((x) => [x.key, x.pts]), [["runs", 37], ["sixes", 10], ["milestone", 4]]);
assert.equal(rk.base, 51);
assert.equal(rk.mult, 2);
assert.equal(rk.total, 102);
// Dhir as vice-captain: 57 + 4 + 6 + 8 = 75, times 1.5 = 112.5
const dh = eventReceipt(paltan, "dhir", 4);
assert.equal(dh.base, 75);
assert.equal(dh.total, 112.5);
// Rickelton over the whole match so far (after Samson's catch): 51 + 8
assert.equal(fullReceipt(paltan, "rickelton", 8).base, 59);
assert.ok(fullReceipt(paltan, "rickelton", 8).parts.some((x) => x.key === "catches" && x.pts === 8));
// Suryakumar's boundaries were not in the scorecard: the receipt must say so
assert.equal(eventReceipt(paltan, "suryakumar", 2).notes.length, 1);
assert.equal(eventReceipt(paltan, "rickelton", 1).notes.length, 0);

// ---- Radar: contributions must add up to the lead after every event, for any pair of teams ----
const custom = { players: ["bumrah","boult","bhagat","ghazanfar","jacks","minz","samson","kamboj","noor","ghosh","overton"], captain: "kamboj", vice: "noor" };
for (const [a, b] of [[paltan, yellow], [yellow, paltan], [custom, yellow], [custom, PRESET_TEAMS[3]]]) {
  for (let i = -1; i < SNAPSHOTS.length; i++) {
    const r = radar(a, b, i);
    assert.equal(r.rows.reduce((t, x) => t + x.net, 0), r.lead, `radar sum ${a.id || "custom"} vs ${b.id} at ${i}`);
    assert.equal(r.lead, teamTotal(a, i) - teamTotal(b, i));
  }
}
// Paltan vs Yellow Army at the end: 5 shared players. Your biggest edge is Rickelton (59 x 2 = 118),
// the rival's biggest edge is Kartik as vice-captain (72 x 1.5 = 108), and Gaikwad is worth 92 to you but 92 x 2 = 184 to them.
const rd = radar(paltan, yellow, last);
assert.equal(rd.rows.filter((x) => x.group === "both").length, 5);
const gk = rd.rows.find((x) => x.id === "gaikwad");
assert.equal(gk.group, "both");
assert.equal(gk.myMult, 1);
assert.equal(gk.theirMult, 2);
assert.equal(gk.net, 92 - 184);
assert.equal(rd.rows[0].id, "rickelton");
assert.equal(rd.rows[0].net, 118);
const worst = rd.rows.reduce((m, x) => (x.net < m.net ? x : m));
assert.equal(worst.id, "kartik");
assert.equal(worst.net, -108);
assert.equal(rd.lead, -61.5);

console.log("Paltan minus Yellow after each event:", SNAPSHOTS.map((_, i) => lead(i)).join(", "));
console.log("Final: MI Paltan", teamTotal(paltan, last), "| Yellow Army", teamTotal(yellow, last));
console.log("receipts and radar ok");
console.log("engine ok");
