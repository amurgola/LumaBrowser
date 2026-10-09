export default class AiChatMarkup {
  static SETTINGS_HTML = `
    <div class="luma-field">
      <label class="luma-field-label">System Prompt</label>
      <textarea class="luma-field-input luma-field-textarea" id="ext-ac-systemPrompt" rows="4" placeholder="You are a helpful browser automation assistant..."></textarea>
      <div class="luma-field-help">Custom instructions prepended to every conversation. Leave blank for default behavior.</div>
    </div>
    <div class="luma-field">
      <label class="luma-field-label">Navigator Model</label>
      <select class="luma-field-select" id="ext-ac-modelSelect">
        <option value="">Use active provider (default)</option>
      </select>
      <div class="luma-field-help">Select which LLM model drives the AI chat. This model navigates the browser, clicks elements, and reads pages.</div>
    </div>
    <div class="luma-field">
      <label class="luma-field-label">Conversations</label>
      <div class="ext-form-actions-inline">
        <button class="luma-btn" id="ext-ac-exportBtn">Export All</button>
      </div>
      <div class="luma-field-help">Export your chat conversations as JSON. Conversations are shared with the LLM tab; delete individual ones from either chat surface.</div>
    </div>
  `;

  static CHAT_PANEL_HTML = `
    <div class="ai-chat-panel" id="aiChatPanel">
      <div class="resize-handle resize-handle--row" data-resize="ai-chat" aria-hidden="true"></div>
      <div class="ai-chat-header">
        <div class="ai-chat-header-left">
          <h4>AI Assistant</h4>
          <select class="ai-chat-model" id="aiChatModel" title="Model for this chat" aria-label="Model for this chat"></select>
          <span class="ai-chat-tools-wrap">
            <button type="button" class="luma-btn" id="aiChatTools" title="Tools for this chat" aria-label="Tools for this chat" aria-haspopup="true">Tools</button>
            <div class="ai-chat-tools-pop" id="aiChatToolsPop" role="group" aria-label="Tools for this chat"></div>
          </span>
          <span class="ai-chat-context" id="aiChatContext" hidden></span>
          <span class="ai-chat-status" id="aiChatStatus"></span>
        </div>
        <div class="ai-chat-header-actions">
          <button class="ai-chat-new" id="aiChatNewConversation" title="Start a new conversation">New</button>
          <button class="ai-chat-clear" id="aiChatClear" title="Delete current conversation">Delete</button>
          <button class="ai-chat-close" id="aiChatClose"><svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true"><path d="M3.5 3.5l7 7m0-7l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg></button>
        </div>
      </div>
      <div class="ai-chat-content">
        <aside class="ai-chat-history" aria-label="Conversation history">
          <div class="ai-history-title-row">Conversations</div>
          <div class="ai-history-list" id="aiChatHistoryList"></div>
        </aside>
        <section class="ai-chat-thread">
          <div class="ai-chat-messages" id="aiChatMessages"></div>
        </section>
      </div>
      <div class="ai-chat-input-area">
        <input type="text" class="ai-chat-input" id="aiChatInput" placeholder="Ask the AI to do something... (e.g., 'find the cheapest price for Calculus on this page')">
        <button class="ai-chat-send" id="aiChatSend">Send</button>
        <button class="ai-chat-stop" id="aiChatStop">Stop</button>
      </div>
    </div>
  `;

  static CHAT_MODALS_HTML = `
    <div class="ai-chat-confirm-modal" id="aiChatConfirmModal" role="dialog" aria-modal="true" aria-labelledby="aiChatConfirmTitle">
      <div class="ai-chat-confirm-content">
        <div class="ai-chat-confirm-title" id="aiChatConfirmTitle">Confirm action</div>
        <div class="ai-chat-confirm-message" id="aiChatConfirmMessage"></div>
        <div class="ai-chat-confirm-actions">
          <button class="ai-chat-confirm-btn" id="aiChatConfirmCancelBtn">Cancel</button>
          <button class="ai-chat-confirm-btn danger" id="aiChatConfirmOkBtn">Delete</button>
        </div>
      </div>
    </div>
  `;
}
