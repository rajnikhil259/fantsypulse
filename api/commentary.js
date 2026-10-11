import crypto from "node:crypto";

// Serverless function (Vercel). API keys live in environment variables and never reach the browser.
// Order: Groq (fast) -> Gemini (backup) -> 503, and the page then shows a plain rule-based message.

const cache = new Map(); // best-effort: lives while the function instance is warm
const hits = new Map(); // ip -> { count, reset }
const MAX_CACHE = 500;
const LIMIT_PER_MIN = 40;
const TIMEOUT_MS = 8000;

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) {
    hits.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  rec.count += 1;
  return rec.count > LIMIT_PER_MIN;
}

const clip = (v, n) => String(v ?? "").slice(0, n);
const num = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v) * 10) / 10 : 0);

// Never trust the browser: rebuild a small, clean payload before it goes near a prompt.
function sanitize(b) {
  const fan = b?.fan || {};
  const clean = {
    mode: b?.mode === "recap" ? "recap" : "event",
    mood: b?.mood === "banter" ? "banter" : "calm",
    fan: {
      team: clip(fan.team, 40),
      captain: clip(fan.captain, 40),
      vice: clip(fan.vice, 40),
      teamFantasyTotal: num(fan.total),
      rivalTeam: clip(fan.rivalTeam, 40),
      rivalFantasyTotal: num(fan.rivalTotal),
    },
  };
  // Do the maths here so the AI never has to
  const gap = Math.round((clean.fan.teamFantasyTotal - clean.fan.rivalFantasyTotal) * 10) / 10;
  clean.fan.standing = gap > 0 ? `fan leads rival by ${gap} fantasy points` : gap < 0 ? `fan trails rival by ${-gap} fantasy points` : "fan and rival are level";
  if (clean.mode === "event") {
    const e = b?.event || {};
    const d = e.detail || {};
    clean.event = {
      over: clip(e.over, 8),
      score: clip(e.score, 30),
      title: clip(e.title, 60),
      text: clip(e.text, 300),
      result: !!e.result,
      detail: {
        batters: (Array.isArray(d.batters) ? d.batters : []).slice(0, 3).map((b) => ({ name: clip(b.name, 40), runs: num(b.runs), balls: num(b.balls), notOut: !!b.notOut })),
        ...(d.dismissal ? { dismissal: clip(d.dismissal, 12) } : {}),
        ...(d.bowler ? { bowler: clip(d.bowler, 40) } : {}),
        ...(d.caughtBy ? { caughtBy: clip(d.caughtBy, 40) } : {}),
      },
    };
    clean.fan.impacts = (Array.isArray(fan.impacts) ? fan.impacts : []).slice(0, 6).map((i) => ({
      name: clip(i.name, 40),
      multiplier: num(i.multiplier),
      pointsGained: num(i.change),
      thisPlayerTotalSoFar: num(i.total),
    }));
  } else {
    clean.happened = (Array.isArray(b?.happened) ? b.happened : []).slice(-10).map((s) => clip(s, 240));
  }
  if (clean.mode === "event") {
    clean.fan.netGainThisEvent = Math.round(clean.fan.impacts.reduce((sum, i) => sum + i.pointsGained, 0) * 10) / 10;
  }
  return clean;
}

function buildPrompt(p) {
  const tone =
    p.mood === "banter"
      ? "Playful and cheeky, like a friend teasing you in a WhatsApp group. Call the fan 'tu' or 'bhai'. Light roast is fine, never rude."
      : "Calm and reassuring, like a friend who understands cricket and keeps you steady. Call the fan 'aap'. No slang like bhai or mast.";
  const system = [
    "You are Pulse, a match buddy for Indian fantasy-cricket fans.",
    "Write in Hinglish: Hindi words in English letters mixed with English, the way friends text each other. Use words like gaya, aaya, ho gaya, lag gaye. Vary your wording and never end every message with the same phrase. Never reply in plain English only. No Devanagari.",
    "Do not copy event.text word for word. Shorten it in your own words.",
    "The fan is not a player. Never address the fan by a player's name.",
    p.mode === "recap"
      ? "Give a catch-up for someone who stepped away: 3 short sentences, max 55 words."
      : "Reply in 2 short sentences, max 35 words.",
    "First say what happened in the match, using event.text. Then say what it means for the fan's FANTASY points.",
    "IMPORTANT: fan.team and fan.rivalTeam are fantasy teams made by fans, NOT real IPL teams. All points are FANTASY POINTS, never match runs or the match score.",
    "In fan.impacts, pointsGained is what the fan gained on this event (positive means gained, even if the player got out). thisPlayerTotalSoFar is only that one player's points, NOT the team total. Mention the captain (2x) or vice-captain (1.5x) when they are involved.",
    "Use fan.standing for the gap to the rival. Do not state team totals and do not do your own maths.",
    "fan.netGainThisEvent is the TOTAL fantasy points the fan gained on this event. When you quote a gain, quote this number. You may name the biggest contributor, but never present one player's gain as the total.",
    "Describe who did what only from event.detail and event.text, in plain words (for example: X was caught by Y off Z's bowling). Do not invent actions. Never say a player 'took' or 'gave' runs.",
    "Only say fantasy points were lost or disappeared if a pointsGained value is negative. Otherwise points only go up.",
    "event.detail is the official scorecard record. dismissal is how the batter got out, bowler is who took the wicket, caughtBy is who took the catch. Never swap these roles. If a field is missing, do not mention it.",
    "In this app the words captain and vice-captain ALWAYS mean the fan's fantasy captain and vice-captain. Never talk about real team captains.",
    "Only mention people who are named in the JSON. For a catch-up, pick the 2 or 3 biggest moments and use names exactly as written.",
    "These are real players in a real IPL match replay. Use ONLY the facts in the JSON. Never add details that are not in event.text, and never invent stats, scores or predictions. Do not mention the over if it is empty. If the points did not change, say so.",
    "At most one emoji. No hashtags, no markdown, no quotes around the reply.",
    "Style examples only. Do NOT reuse their facts or phrases: (calm) 'Wicket gir gaya, par captain ke points pehle hi lag chuke hain. Tum abhi rival se aage ho.' (banter) 'Arre wah, captain ne jeb bhar di aur rival peeche reh gaya \u{1F602}'",
    "Tone: " + tone,
  ].join(" ");
  return { system, user: JSON.stringify(p) };
}

async function withTimeout(url, init) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function groqOnce({ system, user }, extra) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("no groq key");
  const r = await withTimeout("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      temperature: 0.7,
      max_tokens: 600, // reasoning models spend tokens thinking first, so leave room for the answer
      ...extra,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!r.ok) {
    const err = new Error("groq " + r.status);
    err.status = r.status;
    throw err;
  }
  const j = await r.json();
  const text = j?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("groq empty");
  return text;
}

async function callGroq(prompt) {
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  // gpt-oss models think before answering. "low" keeps that short, which means faster replies and fewer empty ones.
  const attempts = /gpt-oss/.test(model) ? [{ reasoning_effort: "low" }, {}] : [{}];
  let last;
  for (const extra of attempts) {
    try {
      return await groqOnce(prompt, extra);
    } catch (e) {
      last = e;
      if (e.status === 429) break; // rate limited: retrying now will not help
    }
  }
  throw last;
}

async function callGemini({ system, user }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("no gemini key");
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const r = await withTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
    }),
  });
  if (!r.ok) throw new Error("gemini " + r.status);
  const j = await r.json();
  const text = j?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim();
  if (!text) throw new Error("gemini empty");
  return text;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST only" });
  }

  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) return res.status(429).json({ error: "Too many requests. Try again in a minute." });

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Bad JSON" });
    }
  }
  const payload = sanitize(body);
  const key = crypto.createHash("sha1").update(JSON.stringify(payload)).digest("hex");

  const hit = cache.get(key);
  if (hit) return res.status(200).json({ ...hit, cached: true });

  const prompt = buildPrompt(payload);
  const providers = [
    ["groq", callGroq],
    ["gemini", callGemini],
  ];
  for (const [source, fn] of providers) {
    try {
      const text = (await fn(prompt)).replace(/^["']|["']$/g, "").slice(0, 400);
      const out = { text, source };
      if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
      cache.set(key, out);
      return res.status(200).json(out);
    } catch (e) {
      console.warn(`[commentary] ${source} failed:`, e.message);
    }
  }
  return res.status(503).json({ error: "AI unavailable" });
}