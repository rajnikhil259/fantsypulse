import { PLAYERS, EVENTS } from "./data/match44.js";

// ---- Scoring rules (simplified T20 style, inspired by fantasy apps but NOT the official Dream11 table). ----
// Plain code on purpose: the AI explains these numbers, it never makes them.
export const RULES = {
  run: 1,
  four: 1, // bonus on top of the 4 runs
  six: 2, // bonus on top of the 6 runs
  thirty: 4,
  fifty: 8,
  duck: -2,
  wicket: 25,
  bowledBonus: 8, // bowled or LBW
  catch: 8,
};
export const CAPTAIN_MULT = 2;
export const VICE_MULT = 1.5;

export const playerById = Object.fromEntries(PLAYERS.map((p) => [p.id, p]));

// Short names for chips and tight spaces
const SHORT = { suryakumar: "Suryakumar", tilak: "Tilak", noor: "Noor", urvil: "Urvil", kartik: "Kartik", ghazanfar: "Ghazanfar" };
export function shortName(id) {
  if (SHORT[id]) return SHORT[id];
  const parts = playerById[id].name.split(" ");
  return parts[parts.length - 1];
}

const batEntries = (e) => (e.bat ? (Array.isArray(e.bat) ? e.bat : [e.bat]) : []);

function blank() {
  return { runs: 0, fours: 0, sixes: 0, out: false, wickets: 0, bowledWickets: 0, catches: 0 };
}

// One line per scoring rule that applies to a player's stats. This is what the "receipt" shows.
export function breakdown(s) {
  const parts = [];
  const add = (key, label, pts) => {
    if (pts !== 0) parts.push({ key, label, pts });
  };
  add("runs", `${s.runs} run${s.runs === 1 ? "" : "s"}`, s.runs * RULES.run);
  add("fours", `${s.fours} four${s.fours === 1 ? "" : "s"} (+${RULES.four} each)`, s.fours * RULES.four);
  add("sixes", `${s.sixes} six${s.sixes === 1 ? "" : "es"} (+${RULES.six} each)`, s.sixes * RULES.six);
  if (s.runs >= 50) add("milestone", "50-run bonus", RULES.fifty);
  else if (s.runs >= 30) add("milestone", "30-run bonus", RULES.thirty);
  if (s.out && s.runs === 0) add("duck", "Duck", RULES.duck);
  add("wickets", `${s.wickets} wicket${s.wickets === 1 ? "" : "s"} (${RULES.wicket} each)`, s.wickets * RULES.wicket);
  add("bowled", `Bowled/LBW bonus (+${RULES.bowledBonus} each)`, s.bowledWickets * RULES.bowledBonus);
  add("catches", `${s.catches} catch${s.catches === 1 ? "" : "es"} (${RULES.catch} each)`, s.catches * RULES.catch);
  return parts;
}

export function pointsOf(s) {
  return breakdown(s).reduce((t, p) => t + p.pts, 0);
}

function pointsMap(stats) {
  const m = {};
  for (const p of PLAYERS) m[p.id] = pointsOf(stats[p.id]);
  return m;
}

function build() {
  let stats = Object.fromEntries(PLAYERS.map((p) => [p.id, blank()]));
  let before = pointsMap(stats);
  const snaps = [];
  for (const ev of EVENTS) {
    const next = structuredClone(stats);
    for (const b of batEntries(ev)) {
      const s = next[b.id];
      s.runs += b.r;
      s.fours += b.f;
      s.sixes += b.s;
      if (b.out) s.out = true;
    }
    if (ev.wkt) {
      next[ev.wkt.bowler].wickets += 1;
      if (ev.wkt.how === "bowled" || ev.wkt.how === "lbw") next[ev.wkt.bowler].bowledWickets += 1;
      if (ev.wkt.how === "caught" && ev.wkt.fielder) next[ev.wkt.fielder].catches += 1;
    }
    const after = pointsMap(next);
    const delta = {};
    for (const id in after) delta[id] = after[id] - before[id];
    snaps.push({ stats: next, points: after, delta });
    stats = next;
    before = after;
  }
  return snaps;
}

export const SNAPSHOTS = build();

export function multiplier(team, id) {
  if (id === team.captain) return CAPTAIN_MULT;
  if (id === team.vice) return VICE_MULT;
  return 1;
}

export function teamTotal(team, idx) {
  if (idx < 0) return 0;
  const snap = SNAPSHOTS[idx];
  return team.players.reduce((sum, id) => sum + snap.points[id] * multiplier(team, id), 0);
}

// Players in this team whose points changed on this event, with the captain/vice multiplier applied.
export function teamImpacts(team, idx) {
  const snap = SNAPSHOTS[idx];
  return team.players
    .filter((id) => snap.delta[id] !== 0)
    .map((id) => ({
      id,
      name: playerById[id].name,
      short: shortName(id),
      mult: multiplier(team, id),
      raw: snap.delta[id],
      delta: snap.delta[id] * multiplier(team, id),
      total: snap.points[id] * multiplier(team, id),
    }));
}

// ---- Receipt: where did these points come from? ----
// Parts that were earned between two moments of the match (from = -1 means "since the start").
function changeParts(before, after) {
  const d = (k) => after[k] - before[k];
  const n = (x, one, many) => `${x} ${x === 1 ? one : many}`;
  const parts = [];
  const add = (key, label, pts) => {
    if (pts !== 0) parts.push({ key, label, pts });
  };
  add("runs", n(d("runs"), "run", "runs"), d("runs") * RULES.run);
  add("fours", `${n(d("fours"), "four", "fours")} (+${RULES.four} each)`, d("fours") * RULES.four);
  add("sixes", `${n(d("sixes"), "six", "sixes")} (+${RULES.six} each)`, d("sixes") * RULES.six);
  const milestone = (st) => (st.runs >= 50 ? RULES.fifty : st.runs >= 30 ? RULES.thirty : 0);
  const dm = milestone(after) - milestone(before);
  if (dm) add("milestone", after.runs >= 50 ? (before.runs >= 30 ? "50-run bonus (replaces the 30-run bonus)" : "50-run bonus") : "30-run bonus", dm);
  const duck = (st) => (st.out && st.runs === 0 ? RULES.duck : 0);
  add("duck", "Duck", duck(after) - duck(before));
  add("wickets", `${n(d("wickets"), "wicket", "wickets")} (${RULES.wicket} each)`, d("wickets") * RULES.wicket);
  add("bowled", `Bowled/LBW bonus (+${RULES.bowledBonus} each)`, d("bowledWickets") * RULES.bowledBonus);
  add("catches", `${n(d("catches"), "catch", "catches")} (${RULES.catch} each)`, d("catches") * RULES.catch);
  return parts;
}

// A player's points between two moments, with the captain / vice-captain multiplier applied at the end.
export function receipt(team, id, from, to) {
  const before = from < 0 ? blank() : SNAPSHOTS[from].stats[id];
  const after = SNAPSHOTS[to].stats[id];
  const parts = changeParts(before, after);
  const base = parts.reduce((t, p) => t + p.pts, 0);
  const mult = multiplier(team, id);
  const notes = [];
  for (let i = from + 1; i <= to; i++) {
    const ev = EVENTS[i];
    if ((ev.unknown || []).some((k) => k === "f" || k === "s") && batEntries(ev).some((b) => b.id === id)) {
      notes.push("Fours and sixes for this innings were not in the public scorecard, so no boundary bonus is included.");
      break;
    }
  }
  return { id, name: playerById[id].name, short: shortName(id), mult, parts, base, total: base * mult, notes };
}
export const eventReceipt = (team, id, idx) => receipt(team, id, idx - 1, idx); // points from this one event
export const fullReceipt = (team, id, idx) => receipt(team, id, -1, idx); // points from the whole match so far

// ---- Rival radar: which players are driving the gap between two teams? ----
// For every player on either team: what he is worth to you, what he is worth to your rival, and the difference.
// The differences add up exactly to the lead you see on screen.
export function radar(team, rival, idx) {
  const snap = idx >= 0 ? SNAPSHOTS[idx] : null;
  const ids = [...new Set([...team.players, ...rival.players])];
  const rows = ids
    .map((id) => {
      const inMine = team.players.includes(id);
      const inTheirs = rival.players.includes(id);
      const pts = snap ? snap.points[id] : 0;
      const mine = inMine ? pts * multiplier(team, id) : 0;
      const theirs = inTheirs ? pts * multiplier(rival, id) : 0;
      return {
        id,
        name: playerById[id].name,
        short: shortName(id),
        group: inMine && inTheirs ? "both" : inMine ? "mine" : "theirs",
        myMult: inMine ? multiplier(team, id) : 0,
        theirMult: inTheirs ? multiplier(rival, id) : 0,
        mine,
        theirs,
        net: mine - theirs,
      };
    })
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || a.name.localeCompare(b.name));
  return { rows, lead: teamTotal(team, idx) - teamTotal(rival, idx) };
}

export function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function signed(n) {
  return (n > 0 ? "+" : "") + fmt(n);
}

// Facts sent to the backend. Only numbers computed by the engine go in; the model just words them.
// Official scorecard record for one event. Fields that are inferred or unconfirmed are left out on purpose,
// so the AI never states them as fact.
function scorecardDetail(ev) {
  const unknown = ev.unknown || [];
  const inferred = ev.inferred || [];
  const detail = {
    batters: batEntries(ev).map((b) => ({ name: playerById[b.id].name, runs: b.r, balls: b.balls, notOut: !b.out })),
  };
  if (ev.wkt) {
    if (!unknown.includes("how")) detail.dismissal = ev.wkt.how;
    if (!inferred.includes("bowler")) detail.bowler = playerById[ev.wkt.bowler].name;
    if (ev.wkt.fielder && !unknown.includes("fielder")) detail.caughtBy = playerById[ev.wkt.fielder].name;
  }
  return detail;
}

export function buildFacts({ team, rival, idx, mood }) {
  const ev = EVENTS[idx];
  return {
    mode: "event",
    mood,
    event: { over: ev.over || "", score: ev.score || "", title: ev.title, text: ev.text, result: !!ev.result, detail: scorecardDetail(ev) },
    fan: {
      team: team.name,
      captain: playerById[team.captain].name,
      vice: playerById[team.vice].name,
      impacts: teamImpacts(team, idx).map((i) => ({
        name: i.name,
        multiplier: i.mult,
        change: i.delta,
        total: i.total,
      })),
      total: teamTotal(team, idx),
      rivalTeam: rival.name,
      rivalTotal: teamTotal(rival, idx),
    },
  };
}

export function buildRecapFacts({ team, rival, idx, mood }) {
  return {
    mode: "recap",
    mood,
    happened: EVENTS.slice(0, idx + 1).map((e) => `${e.over ? e.over + " " : ""}${e.text}`).slice(-10),
    fan: {
      team: team.name,
      captain: playerById[team.captain].name,
      vice: playerById[team.vice].name,
      total: teamTotal(team, idx),
      rivalTeam: rival.name,
      rivalTotal: teamTotal(rival, idx),
    },
  };
}

// Used only when the AI backend is unreachable. Built from the same facts, so it is always correct (just less friendly).
export function fallbackMessage({ team, rival, idx }) {
  const impacts = teamImpacts(team, idx);
  const total = teamTotal(team, idx);
  const rt = teamTotal(rival, idx);
  const gap = total - rt;
  const standing = gap === 0 ? "You and " + rival.name + " are level." : gap > 0 ? `You lead ${rival.name} by ${fmt(gap)}.` : `You trail ${rival.name} by ${fmt(-gap)}.`;
  if (!impacts.length) return `No change to your points right now. ${standing}`;
  const top = [...impacts].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  const tag = top.mult === 2 ? " (your captain, 2x)" : top.mult === 1.5 ? " (your vice-captain, 1.5x)" : "";
  return `${top.name}${tag}: ${signed(top.delta)} points for your team. ${standing}`;
}