# Basecamp Support Agent

A working reference implementation of an AI customer support agent: it understands
customer requests, retrieves accurate information from a knowledge base, calls
business tools (order lookup, refunds, escalation), and responds conversationally.

Built around a fictional outdoor gear retailer ("Basecamp Supply Co.") so the demo
data is concrete, but every piece is meant to be swapped for real systems.

## Architecture

```
support-agent-project/
├── backend/
│   ├── server.js           Express API (POST /api/chat)
│   ├── src/
│   │   ├── agent.js        The Claude tool-use loop (call → run tools → repeat)
│   │   ├── tools.js        Tool schemas + dispatcher
│   │   ├── knowledgeBase.js  Mock help-center content + keyword search (swap for real RAG/vector DB)
│   │   └── orders.js       Mock order data + refund logic (swap for your order system / CRM)
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html          Chat UI
    ├── style.css
    └── app.js              Talks to the backend over fetch()
```

**How the agent loop works** (`backend/src/agent.js`):
1. The user's message is appended to conversation history.
2. Claude is called with the full history and the tool schemas.
3. If Claude's response includes `tool_use` blocks, each is executed locally
   (`runTool`), and the results are sent back as `tool_result` blocks.
4. This repeats until Claude responds with plain text (no more tool calls),
   which becomes the reply shown to the user.

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env and add your ANTHROPIC_API_KEY
npm start
```

The API runs on `http://localhost:3001` by default. Health check: `GET /api/health`.

### 2. Frontend

The frontend is static — no build step. Just open `frontend/index.html` in a
browser, or serve it:

```bash
cd frontend
npx serve .
```

Make sure the backend is running first; `app.js` points at
`http://localhost:3001` (edit `BACKEND_URL` in `app.js` if you deploy the
backend elsewhere).

## Try it

Once both are running, try:
- "Where's my order BC-1042?"
- "What's your return policy?"
- "I want a refund on BC-2207, it arrived damaged"
- "Can I talk to a real person?"

Mock order IDs: `BC-1042`, `BC-2207`, `BC-3390` (see `backend/src/orders.js`).

## Extending toward production

- **Retrieval**: replace `knowledgeBase.js`'s keyword search with a real
  embeddings/vector-DB lookup (e.g. Pinecone, pgvector) over your actual
  help-center content.
- **Business tools**: replace `orders.js` with calls to your real order
  management system, payments provider, etc.
- **Sessions**: the backend keeps conversation history in an in-memory `Map`
  keyed by `sessionId` — swap for Redis or a database, and generate/store
  `sessionId` per logged-in user or browser session.
- **Escalation**: `escalate_to_human` in `tools.js` just returns a message;
  wire it to your real ticketing system or Slack alert.
- **Auth & rate limiting**: add authentication and rate limits to
  `/api/chat` before exposing this publicly.
