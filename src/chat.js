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
 * @param {string} [text="Generating visualization..."] - Initial loading text.
 * @returns {HTMLElement} The loading element (remove it when done).
 */
export function showLoading(text = "Generating visualization...") {
  const el = document.createElement("div");
  el.classList.add("chat-msg", "assistant", "loading-dots");
  el.textContent = text;
  messagesContainer.appendChild(el);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return el;
}

/**
 * Update the text of a loading element (e.g. for retry feedback).
 * @param {HTMLElement} el - Loading element from showLoading.
 * @param {string} text - New text.
 */
export function updateLoadingText(el, text) {
  if (el) el.textContent = text;
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
