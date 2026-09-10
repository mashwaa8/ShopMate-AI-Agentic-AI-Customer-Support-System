const { TOOLS, runTool } = require("./tools");

const SYSTEM_PROMPT = `You are the customer support agent for Basecamp Supply Co., an outdoor gear retailer.
Be warm, concise, and conversational — not robotic. Never invent order details, policy specifics, or refund outcomes: always use the tools to check the knowledge base or order system before stating facts.
When a customer wants a refund, confirm the order ID and reason, then call process_refund.
If a request is out of scope (e.g. account security, legal threats, something you can't resolve after trying), call escalate_to_human rather than guessing.
Keep replies short — a few sentences, plain language, no bullet-point overload unless it truly helps.`;

const MODEL = "claude-sonnet-4-6";
const MAX_TOOL_ROUNDS = 6;

async function callClaude(history, apiKey) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: history,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errText}`);
  }
  return response.json();
}

/**
 * Runs one full turn of the agent: takes the existing message history
 * (already including the new user message), calls Claude, executes any
 * tool calls locally, feeds results back, and repeats until Claude
 * returns a final text answer (or the round cap is hit).
 *
 * Returns { history, reply, toolLog, escalated }
 */
async function runAgentTurn(history, apiKey) {
  const toolLog = [];
  let escalated = false;
  let reply = "";
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    rounds++;
    const data = await callClaude(history, apiKey);
    const content = data.content || [];
    history.push({ role: "assistant", content });

    const toolUses = content.filter((b) => b.type === "tool_use");
    const textBlocks = content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (textBlocks) reply = textBlocks;

    if (toolUses.length === 0) break;

    const toolResults = [];
    for (const tu of toolUses) {
      let result;
      try {
        result = runTool(tu.name, tu.input || {});
      } catch (e) {
        result = { error: String(e) };
      }
      if (tu.name === "escalate_to_human" && result.success) escalated = true;

      toolLog.push({ tool: tu.name, input: tu.input, result });
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: JSON.stringify(result),
      });
    }
    history.push({ role: "user", content: toolResults });
  }

  return { history, reply, toolLog, escalated };
}

module.exports = { runAgentTurn };
