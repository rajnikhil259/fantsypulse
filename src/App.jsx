import React, { useMemo, useState } from "react";
import { MATCH } from "./data/match44.js";
import { PRESET_TEAMS } from "./data/fanTeams.js";
import Setup from "./Setup.jsx";
import Match from "./Match.jsx";

const EMPTY = { players: [], captain: null, vice: null };

export default function App() {
  const [screen, setScreen] = useState("setup");
  const [choice, setChoice] = useState("paltan");
  const [custom, setCustom] = useState(EMPTY);
  const [rivalId, setRivalId] = useState("yellow");
  const [rivalCustom, setRivalCustom] = useState(EMPTY);
  const [mood, setMood] = useState("calm");
  const [run, setRun] = useState(0); // bumps on every Start, so a fresh replay begins each time

  // Your team: a ready-made one, or the one you built
  const team = useMemo(() => {
    if (choice === "custom") return { id: "custom", name: "Your team", ...custom };
    return PRESET_TEAMS.find((t) => t.id === choice);
  }, [choice, custom]);

  // Rival: any ready-made team except your own, or a team you build for them
  const rivalOptions = useMemo(() => PRESET_TEAMS.filter((t) => t.id !== choice), [choice]);
  const activeRivalId = rivalId === "custom" || rivalOptions.some((t) => t.id === rivalId) ? rivalId : rivalOptions[0].id;
  const rival = useMemo(() => {
    if (activeRivalId === "custom") return { id: "rival-custom", name: "Rival XI", ...rivalCustom };
    return PRESET_TEAMS.find((t) => t.id === activeRivalId);
  }, [activeRivalId, rivalCustom]);

  return (
    <div className={"shell" + (screen === "match" ? " match-mode" : "")}>
      <header className="top">
        <button className="brand" onClick={() => setScreen("setup")} aria-label="Fantasy Pulse home">
          <span className="mark">Fantasy Pulse</span>
        </button>
        <span className="demo-tag">Replay: {MATCH.title}</span>
      </header>

      <main>
        {screen === "setup" ? (
          <Setup
            choice={choice}
            setChoice={setChoice}
            custom={custom}
            setCustom={setCustom}
            rivalId={activeRivalId}
            rivalOptions={rivalOptions}
            setRivalId={setRivalId}
            rivalCustom={rivalCustom}
            setRivalCustom={setRivalCustom}
            mood={mood}
            setMood={setMood}
            onStart={() => {
              setRun((n) => n + 1);
              setScreen("match");
            }}
          />
        ) : (
          <Match key={run} team={team} rival={rival} mood={mood} onExit={() => setScreen("setup")} />
        )}
      </main>
    </div>
  );
}