import React from "react";
import { fmt, radar, signed } from "./engine.js";

const label = (m) => (m === 2 ? "C" : m === 1.5 ? "VC" : "x1");

// Which players are driving the gap between you and your rival? Numbers come straight from the engine.
export default function Radar({ team, rival, idx }) {
  if (idx < 0) return <p className="empty">The radar starts when the match begins.</p>;

  const { rows, lead } = radar(team, rival, idx);
  const active = rows.filter((r) => r.net !== 0);
  const flat = rows.filter((r) => r.net === 0 && r.group === "both");
  const max = Math.max(1, ...active.map((r) => Math.abs(r.net)));
  const best = active.find((r) => r.net > 0); // rows are sorted by size of impact
  const worst = active.find((r) => r.net < 0); // rows are sorted by size, so the first negative is the rival's biggest edge

  const headline = lead === 0 ? `You are level with ${rival.name}` : lead > 0 ? `You lead ${rival.name} by ${fmt(lead)}` : `You trail ${rival.name} by ${fmt(-lead)}`;

  return (
    <div className="radar">
      <h2 className="h-section">Rival radar</h2>
      <p className="rd-head">{headline}</p>
      <p className="rd-sum">
        {best ? `Your biggest edge: ${best.name} (${signed(best.net)}).` : "You have no edge yet."}{" "}
        {worst ? `Rival's biggest edge: ${worst.name} (${signed(worst.net)}).` : "Your rival has no edge yet."}
      </p>

      <div className="rd-legend" aria-hidden="true">
        <span>Rival gains more</span>
        <span>You gain more</span>
      </div>
      <ul className="rd-list">
        {active.map((r) => {
          const w = (Math.abs(r.net) / max) * 100;
          const tag =
            r.group === "mine"
              ? "only in your team"
              : r.group === "theirs"
              ? "only in rival's team"
              : r.myMult !== r.theirMult
              ? `in both: you ${label(r.myMult)}, rival ${label(r.theirMult)}`
              : "in both teams";
          return (
            <li key={r.id} aria-label={`${r.name}: ${r.net > 0 ? "worth" : "costs you"} ${fmt(Math.abs(r.net))} points`}>
              <div className="rd-top">
                <span className="rd-name">{r.name}</span>
                <span className={"rd-net " + (r.net > 0 ? "pos" : "neg")}>{signed(r.net)}</span>
              </div>
              <div className="rd-bar" aria-hidden="true">
                <span className="side l">{r.net < 0 && <i style={{ width: `${w}%` }} />}</span>
                <span className="side r">{r.net > 0 && <i style={{ width: `${w}%` }} />}</span>
              </div>
              <div className="rd-tag">{tag} | you {fmt(r.mine)}, rival {fmt(r.theirs)}</div>
            </li>
          );
        })}
      </ul>
      {flat.length > 0 && <p className="rd-flat">Worth the same to both: {flat.map((r) => r.name).join(", ")}.</p>}
    </div>
  );
}
