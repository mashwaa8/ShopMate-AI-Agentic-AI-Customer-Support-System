require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { runAgentTurn } = require("./src/agent");

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.ANTHROPIC_API_KEY;
const PORT = process.env.PORT || 3001;

// In-memory conversation store keyed by session id (demo only —
// use Redis, a DB, or your session layer in production).
const sessions = new Map();

app.post("/api/chat", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key." });
  }

  const { sessionId, message } = req.body;
  if (!sessionId || !message) {
    return res.status(400).json({ error: "sessionId and message are required." });
  }

  const history = sessions.get(sessionId) || [];
  history.push({ role: "user", content: message });

  try {
    const { history: updatedHistory, reply, toolLog, escalated } = await runAgentTurn(history, API_KEY);
    sessions.set(sessionId, updatedHistory);
    res.json({ reply, toolLog, escalated });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Failed to reach the AI service. Please try again." });
  }
});

app.post("/api/reset", (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) sessions.delete(sessionId);
  res.json({ ok: true });
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Support agent backend running on http://localhost:${PORT}`);
  if (!API_KEY) console.warn("WARNING: ANTHROPIC_API_KEY is not set. Copy .env.example to .env and fill it in.");
});
