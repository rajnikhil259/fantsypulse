import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Runs api/commentary.js inside "npm run dev", so you can see real AI messages locally
// without Vercel. On Vercel itself, the same file runs as a serverless function.
function localApi(mode) {
  // Read GROQ_API_KEY etc. from .env.local into process.env (never sent to the browser)
  const env = loadEnv(mode, process.cwd(), "");
  for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v;

  return {
    name: "local-api",
    configureServer(server) {
      server.middlewares.use("/api/commentary", async (req, res) => {
        const chunks = [];
        for await (const c of req) chunks.push(c);
        let body;
        try {
          body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
        } catch {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Bad JSON" }));
        }
        // Small adapter so the Vercel-style handler works here
        req.body = body;
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (obj) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(obj));
        };
        try {
          const mod = await server.ssrLoadModule("/api/commentary.js"); // reloads when you edit the file
          await mod.default(req, res);
        } catch (e) {
          console.error("[local-api]", e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: "Server error" }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => ({ plugins: [react(), localApi(mode)] }));