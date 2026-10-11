import React, { useState } from "react";
import { MATCH } from "./data/match44.js";

// Team logo from /public/logos/<code>.png. If the file is missing, shows a coloured badge with initials instead.
export default function Badge({ code, size = 28 }) {
  const t = MATCH.teams[code];
  const [ok, setOk] = useState(true);
  return (
    <span className="badge" style={{ width: size, height: size, background: t.color, color: t.text, fontSize: size * 0.36 }} title={t.name}>
      {ok ? <img src={t.logo} alt="" onError={() => setOk(false)} /> : t.short}
    </span>
  );
}
