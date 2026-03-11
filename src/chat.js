/**
 * Aigis Data Platform Components Monitor
 * AIGIS Platform Team
 * Copyright 2025, Polaris Wireless Inc
 * Proprietary and Confidential
 *
 * Chat interface logic: message rendering and scroll management.
 */

const messagesContainer = document.getElementById("chat-messages");

/**
 * Append a message to the chat panel.
 * @param {string} text - Message content.
 * @param {"user"|"assistant"|"error"|"system"} role - Message role for styling.
 * @returns {HTMLElement} The created message element.
 */
export function addMessage(text, role) {
  const el = document.createElement("div");
  el.classList.add("chat-msg", role);
  el.textContent = text;
  messagesContainer.appendChild(el);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return el;
}

/**
 * Show a loading indicator in the chat.
 * @returns {HTMLElement} The loading element (remove it when done).
 */
export function showLoading() {
  const el = document.createElement("div");
  el.classList.add("chat-msg", "assistant", "loading-dots");
  el.textContent = "Generating visualization";
  messagesContainer.appendChild(el);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return el;
}

/**
 * Remove a loading indicator element.
 * @param {HTMLElement} el
 */
export function removeLoading(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}
