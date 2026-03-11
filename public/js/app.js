(function () {
  "use strict";

  const messagesEl = document.getElementById("messages");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const placeholder = document.getElementById("placeholder");
  const canvas = document.getElementById("chart-canvas");

  // Conversation history sent to the API
  const conversationHistory = [];

  // ---- helpers ----

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function extractCodeBlock(text) {
    // Match fenced JS/javascript code blocks
    const match = text.match(/```(?:javascript|js)?\s*\n([\s\S]*?)```/);
    return match ? match[1].trim() : null;
  }

  function executeVisualization(code) {
    try {
      placeholder.style.display = "none";
      canvas.style.display = "block";
      // eslint-disable-next-line no-new-func
      new Function(code)();
    } catch (err) {
      addMessage("error", `Visualization error: ${err.message}`);
    }
  }

  // ---- main flow ----

  async function handleSubmit(e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    addMessage("user", text);
    conversationHistory.push({ role: "user", content: text });
    input.value = "";
    sendBtn.disabled = true;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unknown server error");
      }

      const reply = data.choices?.[0]?.message?.content ?? "";
      conversationHistory.push({ role: "assistant", content: reply });

      const code = extractCodeBlock(reply);
      if (code) {
        addMessage("assistant", "Chart updated ✓");
        executeVisualization(code);
      } else {
        addMessage("assistant", reply);
      }
    } catch (err) {
      addMessage("error", err.message);
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", handleSubmit);

  // Allow Ctrl+Enter / Cmd+Enter to send
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      form.dispatchEvent(new Event("submit"));
    }
  });
})();
