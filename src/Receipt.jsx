import React from "react";
import { fmt, signed } from "./engine.js";

// "Where did these points come from?" One player, one moment (or the whole match so far).
export default function Receipt({ r, scope }) {
  const bonus = r.total - r.base; // what the captain / vice-captain multiplier added
  return (
    <div className="receipt" role="region" aria-label={`Points receipt for ${r.name}`}>
      <div className="rc-head">
        <b>{r.name}</b>
        <span>{scope}</span>
      </div>
      {r.parts.length === 0 ? (
        <p className="rc-empty">No points earned in this period.</p>
      ) : (
        <ul className="rc-lines">
          {r.parts.map((p) => (
            <li key={p.key}>
              <span>{p.label}</span>
              <span className={p.pts < 0 ? "neg" : ""}>{signed(p.pts)}</span>
            </li>
          ))}
        </ul>
      )}
      {r.mult !== 1 && (
        <>
          <div className="rc-row">
            <span>Subtotal</span>
            <span>{fmt(r.base)}</span>
          </div>
          <div className="rc-row">
            <span>{r.mult === 2 ? "Captain bonus (x2)" : "Vice-captain bonus (x1.5)"}</span>
            <span>{signed(bonus)}</span>
          </div>
        </>
      )}
      <div className="rc-total">
        <span>Your points</span>
        <b>{fmt(r.total)}</b>
      </div>
      {r.notes.map((n) => (
        <p key={n} className="rc-note">{n}</p>
      ))}
    </div>
  );
}
