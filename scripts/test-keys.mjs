// Step 3: checks that both API keys and model names work. Never prints your keys.
const { GROQ_API_KEY, GROQ_MODEL, GEMINI_API_KEY, GEMINI_MODEL } = process.env;
const prompt = "Say hello to an IPL fan in one short Hinglish sentence.";

async function testGroq() {
  if (!GROQ_API_KEY) return console.log("GROQ: no key found in .env.local");
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL || "openai/gpt-oss-120b",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const j = await r.json();
  if (!r.ok) return console.log("GROQ FAILED:", r.status, j?.error?.message);
  const c = j.choices?.[0];
  console.log("GROQ OK:", c?.message?.content?.trim() || "(empty reply)", "| finish:", c?.finish_reason);
}

async function testGemini() {
  if (!GEMINI_API_KEY) return console.log("GEMINI: no key found in .env.local");
  const model = GEMINI_MODEL || "gemini-3.5-flash-lite";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 400 },
    }),
  });
  const j = await r.json();
  if (!r.ok) return console.log("GEMINI FAILED:", r.status, j?.error?.message);
  const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text).join("").trim();
  console.log("GEMINI OK:", text || "(empty reply)");
}

await testGroq();
await testGemini();