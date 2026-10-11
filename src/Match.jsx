import React, { useCallback, useEffect, useRef, useState } from "react";
import { EVENTS, MATCH } from "./data/match44.js";
import { SNAPSHOTS, buildFacts, buildRecapFacts, eventReceipt, fallbackMessage, fmt, fullReceipt, multiplier, playerById, signed, teamImpacts, teamTotal } from "./engine.js";
import Badge from "./Badge.jsx";
import Receipt from "./Receipt.jsx";
import Radar from "./Radar.jsx";

const LAST = EVENTS.length - 1;
const STEP_MS = 6000; // time between events while the replay is playing

// Asks our backend (api/commentary.js) for a Pulse message. Throws if it fails, so the caller can use the fallback.
async function askPulse(facts) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch("/api/commentary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(facts),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error("status " + r.status);
    const j = await r.json();
    if (!j.text) throw new Error("empty");
    return { text: j.text, source: j.source || "ai" };
  } finally {
    clearTimeout(timer);
  }
}

function recapFallback(team, rival, idx) {
  return `Latest: ${EVENTS[idx].text} ${team.name} has ${fmt(teamTotal(team, idx))} points, ${rival.name} has ${fmt(teamTotal(rival, idx))}.`;
}

export default function Match({ team, rival, mood, onExit }) {
  const [idx, setIdx] = useState(-1); // -1 means the match has not started
  const [feed, setFeed] = useState([]); // Pulse messages, newest first
  const [playing, setPlaying] = useState(true);
  const [tab, setTab] = useState("players"); // right column: your players, or the rival radar
  const keyRef = useRef(0);

  // Adds a card to the feed immediately (with a "thinking" state), then fills it in when the AI answers.
  const post = useCallback(
    async (kind, atIdx) => {
      const key = ++keyRef.current;
      setFeed((f) => [{ key, kind, idx: atIdx, status: "loading" }, ...f]);
      const facts = kind === "recap" ? buildRecapFacts({ team, rival, idx: atIdx, mood }) : buildFacts({ team, rival, idx: atIdx, mood });
      let result;
      try {
        result = await askPulse(facts);
      } catch {
        // AI unreachable: a plain note built from the same engine numbers, so the demo never breaks
        result = { text: kind === "recap" ? recapFallback(team, rival, atIdx) : fallbackMessage({ team, rival, idx: atIdx }), source: "rules" };
      }
      setFeed((f) => f.map((m) => (m.key === key ? { ...m, status: "done", ...result } : m)));
    },
    [team, rival, mood]
  );

  const advance = useCallback(() => {
    if (idx >= LAST) return;
    const next = idx + 1;
    setIdx(next);
    post("event", next);
  }, [idx, post]);

  // Autoplay: wait, then move to the next event
  useEffect(() => {
    if (!playing) return;
    if (idx >= LAST) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(advance, idx === -1 ? 800 : STEP_MS);
    return () => clearTimeout(t);
  }, [playing, idx, advance]);

  const you = teamTotal(team, idx);
  const them = teamTotal(rival, idx);
  const finished = idx >= LAST;

  return (
    <div className="match">
      <Scoreboard ev={idx >= 0 ? EVENTS[idx] : null} idx={idx} />

      <div className="controls">
        <button className="btn primary" onClick={() => setPlaying((p) => !p)} disabled={finished}>
          {finished ? "Match finished" : playing ? "Pause replay" : "Resume replay"}
        </button>
        <button className="btn" onClick={advance} disabled={finished}>
          Next event
        </button>
        <button className="btn" onClick={() => post("recap", idx)} disabled={idx < 1}>
          Catch me up
        </button>
        <button className="btn ghost" onClick={onExit}>
          Change team
        </button>
      </div>

      <div className="grid">
        <section className="feed" aria-live="polite" aria-label="Pulse messages">
          <h2 className="h-section">Pulse</h2>
          {feed.length === 0 && <p className="empty">The replay is about to start. Pulse will explain each big moment for {team.name}.</p>}
          {feed.map((m) => (
            <PulseCard key={m.key} m={m} team={team} />
          ))}
        </section>

        <aside className="xi" aria-label="Your team points">
          <Versus team={team} rival={rival} you={you} them={them} finished={finished} />
          <div className="tabs" role="tablist" aria-label="Right panel">
            <button type="button" role="tab" aria-selected={tab === "players"} className={tab === "players" ? "on" : ""} onClick={() => setTab("players")}>
              Your players
            </button>
            <button type="button" role="tab" aria-selected={tab === "radar"} className={tab === "radar" ? "on" : ""} onClick={() => setTab("radar")}>
              Rival radar
            </button>
          </div>
          {tab === "players" ? <Roster team={team} idx={idx} /> : <Radar team={team} rival={rival} idx={idx} />}
        </aside>
      </div>
    </div>
  );
}

function Scoreboard({ ev, idx }) {
  const score = ev ? ev.score || "CSK chasing 160" : "Toss: Mumbai Indians chose to bat";
  return (
    <section className="board" aria-label="Match score">
      <div>
        <div className="teams-row">
          <Badge code="MI" size={30} />
          <span className="vs">vs</span>
          <Badge code="CSK" size={30} />
          <span className="venue">Chepauk, Chennai</span>
        </div>
        <div className="score">{score}</div>
      </div>
      <div className="where">
        {ev ? (
          <>
            <b>{ev.inn === 1 ? "MI batting" : "CSK chasing 160"}</b>
            <span>{ev.over ? `Over ${ev.over}` : "Exact over not confirmed"}</span>
          </>
        ) : (
          <b>Pre-match</b>
        )}
        <span className="progress" aria-hidden="true">
          <i style={{ width: `${((idx + 1) / EVENTS.length) * 100}%` }} />
        </span>
      </div>
    </section>
  );
}

function PulseCard({ m, team }) {
  const [open, setOpen] = useState(null); // which chip's receipt is showing
  const ev = EVENTS[m.idx];
  if (m.kind === "recap") {
    return (
      <article className="card recap">
        <div className="c-head">
          <b>Catch-up</b>
          <span>{ev.over ? `till over ${ev.over}` : "so far"}</span>
        </div>
        <Body m={m} />
      </article>
    );
  }
  const impacts = teamImpacts(team, m.idx);
  const net = impacts.reduce((s, i) => s + i.delta, 0);
  const tone = net > 0 ? "up" : net < 0 ? "down" : "flat";
  return (
    <article className={"card " + tone}>
      <div className="c-head">
        <b>{ev.title}</b>
        <span>{ev.over ? `Over ${ev.over}` : ev.inn === 2 ? "In the chase" : ""}</span>
      </div>
      <div className="c-main">
        <div className={"delta " + tone} aria-label={`Net change ${signed(net)} points`}>
          {net === 0 ? "0" : signed(net)}
          <small>your pts</small>
        </div>
        <Body m={m} />
      </div>
      {impacts.length > 0 && (
        <>
          <ul className="chips">
            {impacts.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  className={"chip " + (i.delta >= 0 ? "pos" : "neg")}
                  aria-expanded={open === i.id}
                  aria-controls={`rc-${m.key}-${i.id}`}
                  onClick={() => setOpen(open === i.id ? null : i.id)}
                >
                  {i.short} {signed(i.delta)}
                  {i.mult === 2 ? " C" : i.mult === 1.5 ? " VC" : ""}
                </button>
              </li>
            ))}
          </ul>
          <p className="tap-hint">Tap a name to see where the points came from</p>
          {open && (
            <div id={`rc-${m.key}-${open}`}>
              <Receipt r={eventReceipt(team, open, m.idx)} scope="From this event" />
            </div>
          )}
        </>
      )}
    </article>
  );
}

function Body({ m }) {
  if (m.status === "loading") {
    return (
      <p className="msg loading" role="status">
        <span className="dots" aria-hidden="true"><i /><i /><i /></span> Pulse is thinking
      </p>
    );
  }
  return (
    <div className="msg-wrap">
      <p className="msg">{m.text}</p>
      <span className="src">{m.source === "rules" ? "Rule-based note (AI offline)" : `Written by AI (${m.source})`}</span>
    </div>
  );
}

function Versus({ team, rival, you, them, finished }) {
  const total = Math.max(you + them, 1);
  const lead = you - them;
  let line = lead === 0 ? "Level with your rival" : lead > 0 ? `You lead by ${fmt(lead)}` : `You trail by ${fmt(-lead)}`;
  if (finished) line = lead === 0 ? "Final: it's a tie" : lead > 0 ? `Final: you beat ${rival.name} by ${fmt(lead)}` : `Final: ${rival.name} beat you by ${fmt(-lead)}`;
  return (
    <div className="versus">
      <div className="v-nums">
        <div>
          <span className="who">{team.name}</span>
          <strong>{fmt(you)}</strong>
        </div>
        <div className="r">
          <span className="who">{rival.name}</span>
          <strong>{fmt(them)}</strong>
        </div>
      </div>
      <div className="bar" aria-hidden="true">
        <i style={{ width: `${(you / total) * 100}%` }} />
      </div>
      <p className="gap">{line}</p>
    </div>
  );
}

function Roster({ team, idx }) {
  const [open, setOpen] = useState(null); // which player's receipt is showing
  const snap = idx >= 0 ? SNAPSHOTS[idx] : null;
  const rows = team.players
    .map((id) => ({
      id,
      p: playerById[id],
      mult: multiplier(team, id),
      pts: snap ? snap.points[id] * multiplier(team, id) : 0,
      changed: snap ? snap.delta[id] !== 0 : false,
    }))
    .sort((a, b) => b.pts - a.pts);
  return (
    <div className="roster">
      <h2 className="h-section">{team.name}</h2>
      <ul>
        {rows.map((r) => (
          // The key changes when a player's points change, which replays the flash animation
          <li key={r.id + ":" + (r.changed ? idx : "x")} className={r.changed ? "flash" : ""}>
            <button type="button" className="r-row" aria-expanded={open === r.id} disabled={idx < 0} onClick={() => setOpen(open === r.id ? null : r.id)}>
              <Badge code={r.p.team} size={20} />
              <span className="nm">
                {r.p.name}
                {r.mult === 2 && <b className="pill cap">C</b>}
                {r.mult === 1.5 && <b className="pill vc">VC</b>}
              </span>
              <span className="pt">{fmt(r.pts)}</span>
            </button>
            {open === r.id && idx >= 0 && <Receipt r={fullReceipt(team, r.id, idx)} scope="Whole match so far" />}
          </li>
        ))}
      </ul>
    </div>
  );
}