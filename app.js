(function () {
  const BACKEND_URL = "http://localhost:3001";
  const sessionId = "demo-" + Math.random().toString(36).slice(2);

  const thread = document.getElementById("bc-thread");
  const input = document.getElementById("bc-input");
  const sendBtn = document.getElementById("bc-send");
  const status = document.getElementById("bc-status");
  const suggestions = document.getElementById("bc-suggestions");

  const STARTERS = [
    "Where's my order BC-1042?",
    "What's your return policy?",
    "I want a refund on BC-2207, it arrived damaged",
    "Can I talk to a real person?",
  ];

  STARTERS.forEach((s) => {
    const chip = document.createElement("button");
    chip.className = "bc-chip";
    chip.textContent = s;
    chip.onclick = () => {
      input.value = s;
      sendMessage();
    };
    suggestions.appendChild(chip);
  });

  function addMessage(role, text) {
    const wrap = document.createElement("div");
    wrap.className = "bc-msg " + (role === "user" ? "user" : "agent");
    const label = document.createElement("div");
    label.className = "bc-role";
    label.textContent = role === "user" ? "You" : "Support Agent";
    const bubble = document.createElement("div");
    bubble.className = "bc-bubble";
    bubble.textContent = text;
    wrap.appendChild(label);
    wrap.appendChild(bubble);
    thread.appendChild(wrap);
    thread.scrollTop = thread.scrollHeight;
  }

  function addToolLog(text, isError) {
    const log = document.createElement("div");
    log.className = "bc-tool-log" + (isError ? " bc-toolerror" : "");
    log.textContent = (isError ? "⚠ " : "→ ") + text;
    thread.appendChild(log);
    thread.scrollTop = thread.scrollHeight;
  }

  function toolLabel(entry) {
    const { tool, input } = entry;
    if (tool === "search_knowledge_base") return `Searched help center for "${input.query}"`;
    if (tool === "get_order_status") return `Looked up order ${(input.order_id || "").toUpperCase()}`;
    if (tool === "process_refund") return `Processed refund for ${(input.order_id || "").toUpperCase()}`;
    if (tool === "escalate_to_human") return "Escalated to a human specialist";
    return "Called " + tool;
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    sendBtn.disabled = true;
    status.textContent = "thinking…";
    status.classList.add("busy");

    addMessage("user", text);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        addMessage("agent", data.error || "Something went wrong.");
      } else {
        (data.toolLog || []).forEach((entry) => addToolLog(toolLabel(entry), !!entry.result?.error));
        if (data.reply) addMessage("agent", data.reply);
        status.textContent = data.escalated ? "escalated to human" : "ready";
      }
    } catch (err) {
      addMessage("agent", "Couldn't reach the support backend. Is the server running on port 3001?");
      console.error(err);
      status.textContent = "ready";
    }

    status.classList.remove("busy");
    sendBtn.disabled = false;
    input.focus();
  }

  sendBtn.onclick = sendMessage;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  addMessage("agent", "Hi, I'm the Basecamp support agent. I can check order status, walk through our policies, or start a refund — what's going on?");
})();
