// Checks the real-match data against the official scorecard totals. Run: node scripts/check-match.mjs
import assert from "node:assert/strict";
import { MATCH, PLAYERS, EVENTS, CHECKS } from "../src/data/match44.js";

const ids = new Set(PLAYERS.map((p) => p.id));
const batEntries = (e) => (e.bat ? (Array.isArray(e.bat) ? e.bat : [e.bat]) : []);

// 1. Every player id used in an event exists
for (const e of EVENTS) {
  for (const b of batEntries(e)) assert.ok(ids.has(b.id), `unknown batter ${b.id} in ${e.id}`);
  if (e.wkt) {
    assert.ok(ids.has(e.wkt.bowler), `unknown bowler in ${e.id}`);
    if (e.wkt.fielder) assert.ok(ids.has(e.wkt.fielder), `unknown fielder in ${e.id}`);
  }
}

// 2. MI wickets: count, bowler tallies and fall-of-wicket overs match the scorecard
const miOut = EVENTS.filter((e) => e.inn === 1 && e.wkt);
assert.equal(miOut.length, CHECKS.mi.wickets);
assert.deepEqual(miOut.map((e) => e.over), CHECKS.mi.fowOvers);
const tally = {};
for (const e of EVENTS.filter((x) => x.wkt)) tally[e.wkt.bowler] = (tally[e.wkt.bowler] || 0) + 1;
assert.deepEqual(tally, CHECKS.bowlerWickets);

// 3. CSK: two wickets, and the batters' runs plus wides add up to 160
const cskBat = EVENTS.filter((e) => e.inn === 2).flatMap(batEntries);
assert.equal(EVENTS.filter((e) => e.inn === 2 && e.wkt).length, CHECKS.csk.wickets);
assert.equal(cskBat.reduce((s, b) => s + b.r, 0) + CHECKS.csk.extras, CHECKS.csk.runs);

// 4. Boundary runs never exceed total runs
for (const b of EVENTS.flatMap(batEntries)) assert.ok(b.f * 4 + b.s * 6 <= b.r, `${b.id}: boundaries exceed runs`);

// 5. Known overs run in order inside each innings
for (const inn of [1, 2]) {
  const overs = EVENTS.filter((e) => e.inn === inn && e.over).map((e) => parseFloat(e.over));
  assert.deepEqual(overs, [...overs].sort((a, b) => a - b), `overs out of order in innings ${inn}`);
}

// 6. Event texts must agree with the structured data, and must not use the word "captain"
//    (the AI confuses real team captains with the fan's fantasy captain)
const byId = Object.fromEntries(PLAYERS.map((p) => [p.id, p.name]));
for (const e of EVENTS) {
  assert.ok(!/captain/i.test(e.text), `${e.id}: event text must not say "captain"`);
  for (const b of batEntries(e)) {
    assert.ok(e.text.includes(byId[b.id]), `${e.id}: text should name ${byId[b.id]}`);
    assert.ok(e.text.includes(String(b.r)), `${e.id}: text should show ${b.r} runs`);
  }
  if (e.wkt) {
    if (!(e.inferred || []).includes("bowler")) assert.ok(e.text.includes(byId[e.wkt.bowler]), `${e.id}: text should name the bowler`);
    if (e.wkt.fielder) assert.ok(e.text.includes(byId[e.wkt.fielder]), `${e.id}: text should name the fielder`);
  }
}

// Report what is still not confirmed, so nothing gets presented as fact by accident
console.log(`${MATCH.title}: ${EVENTS.length} events, ${PLAYERS.length} players. All checks passed.`);
for (const e of EVENTS) {
  if (e.inferred) console.log(`  inferred  ${e.id}: ${e.inferred.join(", ")} - ${e.why}`);
  if (e.unknown) console.log(`  unknown   ${e.id}: ${e.unknown.join(", ")}`);
}
