const { searchKB } = require("./knowledgeBase");
const { getOrderStatus, processRefund } = require("./orders");

// Escalation state is per-conversation in a real system (store on session /
// ticket record). Kept as a simple in-memory flag here since this is a demo.

const TOOLS = [
  {
    name: "search_knowledge_base",
    description:
      "Search the help center for policy and how-to information (returns, refunds, shipping, warranty, gift cards).",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "What to search for" } },
      required: ["query"],
    },
  },
  {
    name: "get_order_status",
    description: "Look up the live status of a specific order by its order ID (format BC-####).",
    input_schema: {
      type: "object",
      properties: { order_id: { type: "string" } },
      required: ["order_id"],
    },
  },
  {
    name: "process_refund",
    description:
      "Process a refund for an eligible order. Only call this after confirming the order ID and reason with the customer.",
    input_schema: {
      type: "object",
      properties: { order_id: { type: "string" }, reason: { type: "string" } },
      required: ["order_id", "reason"],
    },
  },
  {
    name: "escalate_to_human",
    description: "Hand the conversation off to a human support specialist when the request is outside what you can resolve.",
    input_schema: {
      type: "object",
      properties: { reason: { type: "string" } },
      required: ["reason"],
    },
  },
];

function escalateToHuman(reason) {
  // Hook a real notification (Slack, ticketing system, email) here.
  return {
    success: true,
    message: `Conversation flagged for a human support specialist. Reason: "${reason}". They'll follow up by email within one business day.`,
  };
}

function runTool(name, input) {
  switch (name) {
    case "search_knowledge_base":
      return searchKB(input.query || "");
    case "get_order_status":
      return getOrderStatus(input.order_id || "");
    case "process_refund":
      return processRefund(input.order_id || "", input.reason || "not specified");
    case "escalate_to_human":
      return escalateToHuman(input.reason || "not specified");
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

module.exports = { TOOLS, runTool };
