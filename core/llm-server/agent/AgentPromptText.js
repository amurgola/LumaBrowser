class AgentPromptText {
  static browserToolLines(tabId) {
    return [
      `- navigate: Navigate tab. The result lists the page's interactive elements as numbered refs. Params: { "tabId": ${tabId}, "url": "https://example.com" }`,
      '- create_tab: Open new tab. Params: { "url": "https://example.com" }',
      '- get_tabs: List open tabs. Params: none',
      `- observe_page: List the page's interactive elements as numbered refs; call it when you need fresh refs (after scrolling, or when a ref errors). Params: { "tabId": ${tabId} }`,
      `- click: Click an element by its REF number (preferred), a real mouse click at the element. Params: { "tabId": ${tabId}, "ref": 2 }  (fallback: { "tabId": ${tabId}, "selector": "button", "text": "Sign In" })`,
      `- type: Type into a field and optionally submit: use this for search boxes and single-field forms; it does focus + type + Enter in ONE call and reports whether the page navigated. Params: { "tabId": ${tabId}, "ref": 1, "text": "harry potter", "submit": true }`,
      `- fill_form: Fill several form fields. Params: { "tabId": ${tabId}, "fields": [{"ref": 3, "value": "user@example.com"}, {"selector": "#f-name", "value": "Ann"}] }`,
      `- press_key: Press a key. ALWAYS target a field via "ref" or "selector"; Enter on a form field submits its form. Params: { "tabId": ${tabId}, "key": "Enter", "ref": 1 }`,
      `- wait_for: Wait for element. Params: { "tabId": ${tabId}, "selector": "#login-button", "timeout": 5000 }`,
      `- scroll: Scroll page. Params: { "tabId": ${tabId}, "direction": "down", "amount": 600 }`,
      `- get_source: Get page content (prose/data). For clicking or typing, prefer observe_page refs instead. Params: { "tabId": ${tabId}, "type": "text" }`,
      `- screenshot: Capture screenshot. Params: { "tabId": ${tabId} }`,
      `- get_element: Get element info. Params: { "tabId": ${tabId}, "selector": "#btn-simple" }`,
      `- extract_data: Extract structured data from repeating elements. Params: { "tabId": ${tabId}, "baseSelector": ".product-card", "childSelectors": { "title": "h3", "price": ".price" } }`,
    ];
  }
}

module.exports = AgentPromptText;
