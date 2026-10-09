const BrowserToolExecutor = require('./tools/BrowserToolExecutor');
const ToolFenceParser = require('./tools/ToolFenceParser');
const ToolCallNormalizer = require('./tools/ToolCallNormalizer');

class BrowserTools {
  static TOOL_DEFINITIONS = [
    { name: 'navigate', description: 'Navigate tab to URL', params: { tabId: 'number', url: 'string (URL)' }, required: ['url'] },
    { name: 'create_tab', description: 'Create new browser tab', params: { url: 'string (URL)' }, required: ['url'] },
    { name: 'get_tabs', description: 'List all open tabs', params: {} },
    { name: 'observe_page', description: 'List the page\'s interactive elements as numbered refs ([1] input "Search…", [2] button "Go"). Use the ref numbers with click/type/fill_form; no CSS selectors needed.', params: { tabId: 'number' } },
    { name: 'click', description: 'Click an element: pass its ref number from observe_page (preferred), or a CSS selector. A real mouse click is performed at the element.', params: { tabId: 'number', ref: 'number (element ref from observe_page, preferred)', selector: 'string (CSS selector, only when you have no ref)', text: 'string (optional, visible text filter for selector matches)' } },
    { name: 'click_at', description: 'Real mouse click at a pixel position in your latest screenshot (origin top-left). Use it for controls observe_page does not list: canvas apps, custom widgets, unlabeled icons. Prefer click with a ref when one exists. The result names the element that was under the point', params: { tabId: 'number', x: 'number (pixels from the left edge of the screenshot)', y: 'number (pixels from the top edge of the screenshot)', button: 'string (optional: "left"|"right"|"middle", default left)', double: 'boolean (optional, true for a double click)' }, required: ['x', 'y'] },
    { name: 'locate', description: 'Find an element by DESCRIBING it (look, text, position) and let a vision model find it on screen; click=true also clicks it. Use it for controls observe_page does not list: icon-only buttons, canvas apps, custom widgets. Returns the pixel point and the element found there', params: { tabId: 'number', description: 'string (e.g. "the gear icon in the top-right toolbar")', click: 'boolean (true to click it once found)' }, required: ['description'] },
    { name: 'type', description: 'Type into a field and optionally submit, the whole "search for X" flow in ONE call: focuses the field (ref from observe_page or selector), types the text, and with submit=true presses Enter. Result reports whether the page navigated.', params: { tabId: 'number', ref: 'number (element ref from observe_page, preferred)', selector: 'string (CSS selector, only when you have no ref)', text: 'string (the text to type)', submit: 'boolean (press Enter after typing)', clear: 'boolean (default true, replace any existing value)' } },
    { name: 'fill_form', description: 'Fill form fields', params: { tabId: 'number', fields: 'array of {ref: number (from observe_page) OR selector: "CSS selector", value: "text to type"}' }, required: ['fields'] },
    { name: 'select_option', description: 'Choose an option in a dropdown (native select, custom combobox, searchable select) in ONE call: opens it, finds the option by label or value (case-insensitive, fuzzy), picks it with a real click and reports what the dropdown now shows. When nothing matches, the error lists the options that exist. Use this instead of clicking dropdown options yourself', params: { tabId: 'number', ref: 'number (the dropdown\'s ref from observe_page, preferred)', selector: 'string (CSS selector, only when you have no ref)', option: 'string (the option\'s label text or value)', multiple: 'boolean (optional, multi-selects: add to the current selection)' }, required: ['option'] },
    { name: 'set_date', description: 'Set a date field to a date given as yyyy-mm-dd. Works on date pickers backed by an input, including text fields that want MM/DD/YYYY or DD.MM.YYYY (read from the placeholder). Reports the value the field now holds. Calendar-only widgets return an error: open them with click and pick the day with locate or click_at', params: { tabId: 'number', ref: 'number (the date field\'s ref from observe_page, preferred)', selector: 'string (CSS selector, only when you have no ref)', date: 'string (yyyy-mm-dd, e.g. "2025-03-15")' }, required: ['date'] },
    { name: 'set_slider', description: 'Set a slider (price range, rating, volume) to a number in the slider\'s own units. Reports the value it reads afterwards', params: { tabId: 'number', ref: 'number (the slider\'s ref from observe_page, preferred)', selector: 'string (CSS selector, only when you have no ref)', value: 'number (target value, e.g. 250)' }, required: ['value'] },
    { name: 'press_key', description: 'Press a keyboard key. ALWAYS pass ref (from observe_page) or selector to target the field; without it the key goes to whatever is focused.', params: { tabId: 'number', key: 'string (e.g., "Enter")', ref: 'number (element ref from observe_page)', selector: 'string (optional CSS selector of the element to send the key to)' }, required: ['key'] },
    { name: 'scroll', description: 'Scroll page', params: { tabId: 'number', direction: 'string ("up"|"down"|"left"|"right"|"top"|"bottom")', amount: 'number (pixels, ignored for top/bottom)' }, required: ['direction'] },
    { name: 'get_source', description: 'Get page content. Prefer type "markdown" to READ an article/page (clean, structured, low-token); "text" for plain text; "clean"/"full" for HTML.', params: { tabId: 'number', type: 'string ("markdown"|"text"|"clean"|"full")' } },
    { name: 'screenshot', description: 'Capture a page screenshot. In chat the image is attached to the tool result so you can SEE the page; it stays attached for one reply only, so take a fresh screenshot when you need to look again. Its pixel coordinates are what click_at takes. marks=true draws the ref number of each interactive element on the picture', params: { tabId: 'number', marks: 'boolean (optional, number the clickable elements on the image)' } },
    { name: 'wait_for', description: 'Wait for element to appear', params: { tabId: 'number', selector: 'string (CSS selector)', timeout: 'number (ms)' }, required: ['selector'] },
    { name: 'get_element', description: 'Get element properties', params: { tabId: 'number', selector: 'string (CSS selector)' }, required: ['selector'] },
    { name: 'extract_data', description: 'Extract structured data from repeating elements', params: { tabId: 'number', baseSelector: 'string (CSS selector)', childSelectors: 'object mapping field name → relative CSS selector' }, required: ['baseSelector'] },
    { name: 'collect_list', description: 'Collect ALL items of a long list (search results, feeds, product grids) by scrolling it to the end in ONE call: handles infinite scroll, lists that only keep a few rows on screen, and "Load more" buttons, counting each item once. Use it instead of a scroll + extract loop', params: { tabId: 'number', itemSelector: 'string (CSS selector matching each item)', childSelectors: 'object (optional, field name → CSS selector relative to one item; without it each item is {text, href})', maxItems: 'number (optional, default 200)', maxScrolls: 'number (optional, default 30)' }, required: ['itemSelector'] },
  ];

  static getToolPrompt(toolNames) {
    const tools = BrowserTools.TOOL_DEFINITIONS.filter((tool) => !toolNames || toolNames.includes(tool.name));
    return `You can execute browser actions by responding with a JSON tool call block:
\`\`\`tool
{"tool": "tool_name", "params": { ... }}
\`\`\`

Available tools:
${tools.map(BrowserTools._toolLine).join('\n')}

Respond with ONLY ONE tool call per message. After executing, you will receive the result.`;
  }

  static executeTool(toolName, params, browserService, defaults = {}) {
    return BrowserToolExecutor.execute(toolName, params, browserService, defaults);
  }

  static parseToolCalls(content) {
    return ToolFenceParser.parseAll(content);
  }

  static parseToolCall(content) {
    return ToolFenceParser.parseFirst(content);
  }

  static fixIllegalJsonEscapes(text) {
    return ToolFenceParser.fixIllegalJsonEscapes(text);
  }

  static normalizeToolCall(value) {
    return ToolCallNormalizer.normalize(value);
  }

  static _toolLine(tool) {
    const params = Object.entries(tool.params).map(([key, type]) => `"${key}": ${type}`).join(', ');
    return `- ${tool.name}: ${tool.description}. Params: { ${params} }`;
  }
}

module.exports = BrowserTools;
