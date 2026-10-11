import React from "react";
import { PLAYERS, MATCH } from "./data/match44.js";
import { PRESET_TEAMS } from "./data/fanTeams.js";
import { playerById } from "./engine.js";
import Badge from "./Badge.jsx";

const TEAM_CODES = Object.keys(MATCH.teams);
export const MAX_PER_SIDE = 7;
export const TEAM_SIZE = 11;

// Returns a plain-English reason why a custom team is not ready, or null when it is valid.
export function customProblem(team) {
  const n = team.players.length;
  if (n < TEAM_SIZE) return `Pick ${TEAM_SIZE - n} more player${TEAM_SIZE - n === 1 ? "" : "s"}`;
  if (!team.captain) return "Choose a captain (C)";
  if (!team.vice) return "Choose a vice-captain (VC)";
  return null;
}

const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// Reusable squad picker. Used once for your team and once for the rival's team.
function TeamBuilder({ value, setValue }) {
  const counts = value.players.reduce((c, id) => ({ ...c, [playerById[id].team]: (c[playerById[id].team] || 0) + 1 }), {});

  function toggle(id) {
    setValue((c) => {
      if (c.players.includes(id)) {
        return { players: c.players.filter((p) => p !== id), captain: c.captain === id ? null : c.captain, vice: c.vice === id ? null : c.vice };
      }
      if (c.players.length >= TEAM_SIZE) return c;
      if ((counts[playerById[id].team] || 0) >= MAX_PER_SIDE) return c;
      return { ...c, players: [...c.players, id] };
    });
  }

  function setRole(id, role) {
    setValue((c) => {
      const other = role === "captain" ? "vice" : "captain";
      return { ...c, [role]: id, [other]: c[other] === id ? null : c[other] };
    });
  }

  return (
    <div className="builder">
      {TEAM_CODES.map((code) => (
        <div key={code} className="b-col">
          <h3>
            <Badge code={code} size={24} /> {MATCH.teams[code].name} <small>{counts[code] || 0}/{MAX_PER_SIDE}</small>
          </h3>
          {PLAYERS.filter((p) => p.team === code).map((p) => {
            const on = value.players.includes(p.id);
            const full = !on && ((counts[code] || 0) >= MAX_PER_SIDE || value.players.length >= TEAM_SIZE);
            return (
              <div key={p.id} className={"b-row" + (on ? " on" : "")}>
                <button className="b-pick" onClick={() => toggle(p.id)} aria-pressed={on} disabled={full}>
                  <span className="check" aria-hidden="true">{on ? "✓" : ""}</span>
                  {p.name} <em>{p.role}</em>
                </button>
                {on && (
                  <span className="b-roles">
                    <button className={"pill" + (value.captain === p.id ? " cap" : "")} onClick={() => setRole(p.id, "captain")} aria-label={`Make ${p.name} captain`}>C</button>
                    <button className={"pill" + (value.vice === p.id ? " vc" : "")} onClick={() => setRole(p.id, "vice")} aria-label={`Make ${p.name} vice-captain`}>VC</button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function Setup({ choice, setChoice, custom, setCustom, rivalId, rivalOptions, setRivalId, rivalCustom, setRivalCustom, mood, setMood, onStart }) {
  // Show the first thing that is still missing, and say which team it is about when both are custom
  const mine = choice === "custom" ? customProblem(custom) : null;
  const theirs = rivalId === "custom" ? customProblem(rivalCustom) : null;
  const bothCustom = choice === "custom" && rivalId === "custom";
  const problem = mine ? (bothCustom ? "Your team: " + lower(mine) : mine) : theirs ? "Rival XI: " + lower(theirs) : null;

  return (
    <div className="setup">
      <h1 className="hero">Your captain just got out.<br />Now what?</h1>
      <p className="lede">
        Scorecards tell you what happened. Pulse tells you what it means for your fantasy team, in plain Hinglish. Relive the real {MATCH.teams.CSK.name} vs {MATCH.teams.MI.name} game from Chepauk and watch your points move wicket by wicket.
      </p>

      <h2 className="h-section">Who are you today?</h2>
      <div className="choices" role="radiogroup" aria-label="Choose a fan team">
        {PRESET_TEAMS.map((t) => (
          <button key={t.id} role="radio" aria-checked={choice === t.id} className={"choice" + (choice === t.id ? " on" : "")} onClick={() => setChoice(t.id)}>
            <strong>{t.name}</strong>
            <span>{t.tagline}</span>
          </button>
        ))}
        <button role="radio" aria-checked={choice === "custom"} className={"choice" + (choice === "custom" ? " on" : "")} onClick={() => setChoice("custom")}>
          <strong>Build my own XI</strong>
          <span>Pick {TEAM_SIZE} players (max {MAX_PER_SIDE} from one side), a captain and a vice-captain.</span>
        </button>
      </div>

      {choice === "custom" && <TeamBuilder value={custom} setValue={setCustom} />}

      <h2 className="h-section">Whom do you want to beat?</h2>
      <p className="note">Your points are compared with this team in every message, like a friend in a private contest.</p>
      <div className="choices" role="radiogroup" aria-label="Choose your rival">
        {rivalOptions.map((t) => (
          <button key={t.id} role="radio" aria-checked={rivalId === t.id} className={"choice" + (rivalId === t.id ? " on" : "")} onClick={() => setRivalId(t.id)}>
            <strong>{t.name}</strong>
            <span>{t.tagline}</span>
          </button>
        ))}
        <button role="radio" aria-checked={rivalId === "custom"} className={"choice" + (rivalId === "custom" ? " on" : "")} onClick={() => setRivalId("custom")}>
          <strong>Build rival XI</strong>
          <span>Pick the 11 players, captain and vice-captain of your rival yourself.</span>
        </button>
      </div>

      {rivalId === "custom" && (
        <>
          <p className="note builder-title">Build your rival's XI</p>
          <TeamBuilder value={rivalCustom} setValue={setRivalCustom} />
        </>
      )}

      <h2 className="h-section">How should Pulse talk?</h2>
      <div className="seg" role="radiogroup" aria-label="Pulse tone">
        <button role="radio" aria-checked={mood === "calm"} className={mood === "calm" ? "on" : ""} onClick={() => setMood("calm")}>
          Calm analyst
        </button>
        <button role="radio" aria-checked={mood === "banter"} className={mood === "banter" ? "on" : ""} onClick={() => setMood("banter")}>
          Friends-group banter
        </button>
      </div>

      <div className="go">
        <button className="btn primary big" onClick={onStart} disabled={!!problem}>
          Start the match replay
        </button>
        {problem && <span className="hint">{problem}</span>}
      </div>
    </div>
  );
}