class BrowserActions {
  static TAB_ID = { type: 'number', description: 'The ID of the tab' };
  static REF = { type: 'number', description: 'Element ref number from browser_observe_page, preferred over a CSS selector' };

  static ACTIONS = [
    {
      id: 'get_tabs',
      label: 'List open tabs',
      chat: true,
      rest: { method: 'get', path: '/tabs', handler: 'getAllTabs' },
      mcp: {
        name: 'browser_get_tabs',
        description: 'Get all open browser tabs with their URLs, titles, and active status',
        properties: {
          includeSilent: { type: 'boolean', description: 'If true, include silent/hidden tabs in the results (default: false)' },
        },
        required: [],
      },
    },
    {
      id: 'create_tab',
      label: 'Open new tab',
      chat: true,
      rest: { method: 'post', path: '/tabs', handler: 'createTab' },
      mcp: {
        name: 'browser_create_tab',
        description: 'Create a new browser tab and navigate to a URL. The URL will be automatically normalized (https:// added if missing).',
        properties: {
          url: { type: 'string', description: 'The URL to open (e.g., "example.com" or "https://example.com")' },
          silent: { type: 'boolean', description: 'If true, create the tab in the background without showing it in the UI tab bar (default: false)' },
        },
        required: ['url'],
      },
    },
    {
      id: 'close_tab',
      rest: { method: 'delete', path: '/tabs/:id', handler: 'closeTab' },
      mcp: {
        name: 'browser_close_tab',
        description: 'Close a specific browser tab by its ID',
        properties: {
          tabId: { type: 'number', description: 'The ID of the tab to close' },
        },
        required: ['tabId'],
      },
    },
    {
      id: 'activate_tab',
      rest: { method: 'post', path: '/tabs/:id/activate', handler: 'activateTab' },
    },
    {
      id: 'update_tab',
      rest: { method: 'patch', path: '/tabs/:id', handler: 'updateTab' },
    },
    {
      id: 'navigate',
      label: 'Navigate to URL',
      chat: true,
      mcp: {
        name: 'browser_navigate',
        description: 'Navigate a tab to a different URL. The URL will be automatically normalized.',
        properties: {
          tabId: { type: 'number', description: 'The ID of the tab to navigate' },
          url: { type: 'string', description: 'The URL to navigate to' },
        },
        required: ['tabId', 'url'],
      },
    },
    {
      id: 'refresh',
      mcp: {
        name: 'browser_refresh',
        description: 'Refresh/reload a browser tab',
        properties: {
          tabId: { type: 'number', description: 'The ID of the tab to refresh' },
        },
        required: ['tabId'],
      },
    },
    {
      id: 'execute_js',
      mcp: {
        name: 'browser_execute_js',
        description: 'Execute JavaScript code in a browser tab and return the result',
        properties: {
          tabId: { type: 'number', description: 'The ID of the tab to execute JavaScript in' },
          script: { type: 'string', description: 'The JavaScript code to execute' },
        },
        required: ['tabId', 'script'],
      },
    },
    {
      id: 'observe_page',
      label: 'List page elements',
      chat: true,
      mcp: {
        name: 'browser_observe_page',
        description: 'List the page\'s interactive elements as numbered refs ([1] input "Search…", [2] button "Go"). Use the ref numbers with browser_click, browser_type, browser_fill_form and browser_press_key; no CSS selectors needed.',
        properties: { tabId: BrowserActions.TAB_ID },
        required: ['tabId'],
      },
    },
    {
      id: 'click',
      label: 'Click element',
      chat: true,
      rest: { method: 'post', path: '/tabs/:id/click', handler: 'clickElement' },
      mcp: {
        name: 'browser_click',
        description: 'Click an element in a browser tab. Pass its ref number from browser_observe_page (preferred), or a CSS selector. Optionally filter by text content when multiple elements match. The evidence field of the result reports what visibly changed (outcome navigated, new_tab, dialog, changed or no_change, plus a list of changes); no_change means the action did nothing.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          ref: BrowserActions.REF,
          selector: { type: 'string', description: 'CSS selector for the element to click' },
          text: { type: 'string', description: 'Optional text content to match when multiple elements match the selector' },
          llmFallback: { type: 'string', description: 'Natural language description of the element to click. Used as fallback when the CSS selector fails.' },
        },
        required: ['tabId'],
      },
    },
    {
      id: 'click_at',
      label: 'Click at screen point',
      chat: true,
      rest: { method: 'post', path: '/tabs/:id/click-at', handler: 'clickAt' },
      mcp: {
        name: 'browser_click_at',
        description: 'Real mouse click at a pixel position read off browser_screenshot, for controls the page\'s markup doesn\'t expose (canvas apps, custom widgets, unlabeled divs). x/y are pixels of the latest browser_screenshot image (origin top-left), which equal viewport CSS pixels. Prefer browser_click with a ref when observe_page lists the element. The result names the element that was under the point. The evidence field of the result reports what visibly changed (outcome navigated, new_tab, dialog, changed or no_change, plus a list of changes); no_change means the action did nothing.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          x: { type: 'number', description: 'Horizontal pixel in the screenshot (from the left edge)' },
          y: { type: 'number', description: 'Vertical pixel in the screenshot (from the top edge)' },
          button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button (default: left)', default: 'left' },
          clickCount: { type: 'number', enum: [1, 2], description: '2 for a double click (default: 1)', default: 1 },
        },
        required: ['tabId', 'x', 'y'],
      },
    },
    {
      id: 'locate',
      label: 'Find element visually',
      chat: true,
      mcp: {
        name: 'browser_locate',
        description: 'Find an element by DESCRIBING it (what it looks like, its text, where it is) and let a vision model find it on the screenshot; click=true also clicks it with a real mouse click. Use it for controls browser_observe_page does not list or selectors cannot reach: icon-only buttons, canvas apps, custom widgets. Returns viewport pixel coordinates and the element that is there.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          description: { type: 'string', description: 'The element to find, e.g. "the gear icon in the top-right toolbar" or "Edit button in the row for Alice Chen"' },
          click: { type: 'boolean', description: 'Click the element once found (default: false)', default: false },
          zoom: { type: 'boolean', description: 'Refine with a zoomed second look; slower, helps only for tiny targets on large screens (default: false)', default: false },
          button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button when click=true (default: left)', default: 'left' },
          clickCount: { type: 'number', enum: [1, 2], description: '2 for a double click when click=true (default: 1)', default: 1 },
        },
        required: ['tabId', 'description'],
      },
    },
    {
      id: 'type',
      label: 'Type into field',
      chat: true,
      mcp: {
        name: 'browser_type',
        description: 'Type into a field and optionally submit: the whole "search for X" flow in ONE call: focuses the field (ref from browser_observe_page or selector), types the text, and with submit=true presses Enter. Result reports whether the page navigated. The evidence field of the result reports what visibly changed (outcome navigated, new_tab, dialog, changed or no_change, plus a list of changes); no_change means the action did nothing.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          ref: BrowserActions.REF,
          selector: { type: 'string', description: 'CSS selector of the field, only when you have no ref' },
          text: { type: 'string', description: 'The text to type' },
          submit: { type: 'boolean', description: 'Press Enter after typing (default: false)', default: false },
          clear: { type: 'boolean', description: 'Replace any existing value (default: true)', default: true },
          llmFallback: { type: 'string', description: 'Natural language description of the field to type into' },
        },
        required: ['tabId', 'text'],
      },
    },
    {
      id: 'fill_form',
      label: 'Fill form fields',
      chat: true,
      rest: { method: 'post', path: '/tabs/:id/fill', handler: 'fillForm' },
      mcp: {
        name: 'browser_fill_form',
        description: 'Fill form fields in a browser tab. Uses native setter trick for React/Vue compatibility.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          fields: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                ref: { type: 'number', description: 'Element ref for this field from browser_observe_page, preferred over a selector' },
                selector: { type: 'string', description: 'CSS selector for the form field' },
                label: { type: 'string', description: 'Label text to find the associated input' },
                value: { type: 'string', description: 'Value to set in the field' },
                llmFallback: { type: 'string', description: 'Natural language description of this form field' },
              },
              required: ['value'],
            },
            description: 'Array of {ref|selector|label, value} objects to fill',
          },
          llmFallback: { type: 'string', description: 'Natural language description of the form to fill' },
        },
        required: ['tabId', 'fields'],
      },
    },
    {
      id: 'select_option',
      label: 'Choose dropdown option',
      chat: true,
      mcp: {
        name: 'browser_select_option',
        description: 'Choose an option in a dropdown: native <select>, ARIA combobox/listbox (including popups rendered elsewhere in the page, as Ant Design, MUI, Radix and Angular Material do), or type-to-filter comboboxes (React Select, Autocomplete). Matches the option by label or value, case-insensitive and fuzzy; returns the selected label as the page shows it, or the available options when nothing matches.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          ref: BrowserActions.REF,
          selector: { type: 'string', description: 'CSS selector of the dropdown, only when you have no ref' },
          option: { description: 'The option label text or value to choose. An array chooses several on a multi-select', anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
          multiple: { type: 'boolean', description: 'Multi-selects: add to the current selection instead of replacing it (default: false)', default: false },
        },
        required: ['tabId', 'option'],
      },
    },
    {
      id: 'set_date',
      label: 'Set date field',
      chat: true,
      mcp: {
        name: 'browser_set_date',
        description: 'Set a date field from an ISO date (yyyy-mm-dd). Handles native date/datetime-local/month inputs and masked text inputs: the format is read from the placeholder or label (MM/DD/YYYY, DD.MM.YYYY, ...) and typed in that format. Returns the value the field now holds. Calendar-popup-only widgets return an error; use browser_locate or browser_click_at on the day for those.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          ref: BrowserActions.REF,
          selector: { type: 'string', description: 'CSS selector of the date field, only when you have no ref' },
          date: { type: 'string', description: 'ISO date, e.g. "2025-03-15" ("2025-03-15T14:30" for date-time fields)' },
        },
        required: ['tabId', 'date'],
      },
    },
    {
      id: 'set_slider',
      label: 'Set slider',
      chat: true,
      mcp: {
        name: 'browser_set_slider',
        description: 'Set a slider to a numeric value: <input type=range>, or an ARIA slider (role=slider) driven with real arrow keys, with a pointer drag as the fallback. Returns the value the slider reads afterwards.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          ref: BrowserActions.REF,
          selector: { type: 'string', description: 'CSS selector of the slider (or its thumb), only when you have no ref' },
          value: { type: 'number', description: 'Target value, in the slider\'s own units (e.g. a price of 250, not a percentage)' },
        },
        required: ['tabId', 'value'],
      },
    },
    {
      id: 'press_key',
      label: 'Press key',
      chat: true,
      rest: { method: 'post', path: '/tabs/:id/press-key', handler: 'pressKey' },
      mcp: {
        name: 'browser_press_key',
        description: 'Dispatch a keyboard event in a browser tab. ALWAYS pass ref (from browser_observe_page) or selector to target the field; without one the key goes to whatever is focused. The evidence field of the result reports what visibly changed (outcome navigated, new_tab, dialog, changed or no_change, plus a list of changes); no_change means the action did nothing.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          key: { type: 'string', description: 'Key name (e.g., "Enter", "Escape", "Tab", "Backspace", "ArrowDown")' },
          ref: BrowserActions.REF,
          selector: { type: 'string', description: 'Optional CSS selector to focus before pressing the key' },
          llmFallback: { type: 'string', description: 'Natural language description of the element to focus' },
        },
        required: ['tabId', 'key'],
      },
    },
    {
      id: 'scroll',
      label: 'Scroll page',
      chat: true,
      rest: { method: 'post', path: '/tabs/:id/scroll', handler: 'scrollPage' },
      mcp: {
        name: 'browser_scroll',
        description: 'Scroll a browser tab. Either scroll by direction/amount (pixels) or scroll a specific element into view by CSS selector. The evidence field of the result reports what visibly changed (outcome navigated, new_tab, dialog, changed or no_change, plus a list of changes); no_change means the action did nothing.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          selector: { type: 'string', description: 'CSS selector of element to scroll into view' },
          direction: { type: 'string', enum: ['up', 'down', 'left', 'right', 'top', 'bottom'], description: 'Scroll direction, or jump to top/bottom of the page (default: down)', default: 'down' },
          amount: { type: 'number', description: 'Pixels to scroll (default: 600, ignored for top/bottom)', default: 600 },
          llmFallback: { type: 'string', description: 'Natural language description of the element to scroll into view' },
        },
        required: ['tabId'],
      },
    },
    {
      id: 'wait_for',
      label: 'Wait for element',
      chat: true,
      rest: { method: 'post', path: '/tabs/:id/wait', handler: 'waitForElement' },
      mcp: {
        name: 'browser_wait_for',
        description: 'Wait for an element to appear, disappear, or contain specific text in a browser tab.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          selector: { type: 'string', description: 'CSS selector to wait for. Required unless llmFallback is given' },
          text: { type: 'string', description: 'Optional text the matched element must contain; it narrows the selector and cannot replace it' },
          state: { type: 'string', enum: ['visible', 'hidden'], description: 'Wait for element to be visible (default) or hidden/removed', default: 'visible' },
          timeout: { type: 'number', description: 'Maximum time to wait in milliseconds (default: 5000)', default: 5000 },
          llmFallback: { type: 'string', description: 'Natural language description of the element to wait for' },
        },
        required: ['tabId'],
      },
    },
    {
      id: 'get_element',
      label: 'Inspect element',
      chat: true,
      rest: { method: 'get', path: '/tabs/:id/element', handler: 'getElement' },
      mcp: {
        name: 'browser_get_element',
        description: 'Get detailed properties of a DOM element. Returns tagName, text, value, disabled, checked, readOnly, href, src, className, bounding box, visibility, and more.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          selector: { type: 'string', description: 'CSS selector for the element. Required unless llmFallback is given' },
          text: { type: 'string', description: 'Optional text content to match when multiple elements match the selector; it narrows the selector and cannot replace it' },
          llmFallback: { type: 'string', description: 'Natural language description of the element to inspect' },
        },
        required: ['tabId'],
      },
    },
    {
      id: 'get_source',
      label: 'Read page source',
      chat: true,
      rest: { method: 'get', path: '/tabs/:id/source', handler: 'getTabSource' },
      mcp: {
        name: 'browser_get_source',
        description: 'Get the HTML source code of a tab. Supports multiple extraction types: full (complete HTML), clean (removes scripts/styles/data:image/empty tags - default), minimal (basic structure), text (text content only)',
        properties: {
          tabId: { type: 'number', description: 'The ID of the tab to get source from' },
          type: { type: 'string', enum: ['full', 'clean', 'minimal', 'text'], description: 'Extraction type (default: clean)', default: 'clean' },
        },
        required: ['tabId'],
      },
    },
    {
      id: 'extract_data',
      label: 'Extract structured data',
      chat: true,
      rest: { method: 'post', path: '/tabs/:id/extract-data', handler: 'extractData' },
      mcp: {
        name: 'browser_extract_data',
        description: 'Extract structured data from repeating page elements (search results, product cards, table rows): returns one object per row, no JS injection needed. baseSelector matches each repeating item; childSelectors map field names to CSS selectors relative to one item; each value is the matched element\'s text content.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          baseSelector: { type: 'string', description: 'CSS selector matching each repeating item' },
          childSelectors: { type: 'object', additionalProperties: { type: 'string' }, description: 'Field name → CSS selector relative to one item' },
        },
        required: ['tabId'],
      },
    },
    {
      id: 'collect_list',
      label: 'Collect long list',
      chat: true,
      mcp: {
        name: 'browser_collect_list',
        description: 'Collect every item of a long list by scrolling it to the end: infinite scroll, virtualized lists (which keep only a few rows in the page at a time) and "Load more" buttons. Rows are de-duplicated across scrolls. Pass itemSelector (+ optional childSelectors). Returns {items, count, scrolls, stoppedBecause}.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          itemSelector: { type: 'string', description: 'CSS selector matching each list item' },
          childSelectors: { type: 'object', additionalProperties: { type: 'string' }, description: 'Field name → CSS selector relative to one item. Without it each item is {text, href}' },
          maxItems: { type: 'number', description: 'Stop after this many items (default: 200)', default: 200 },
          maxScrolls: { type: 'number', description: 'Stop after this many scrolls or load-more clicks (default: 30)', default: 30 },
        },
        required: ['tabId'],
      },
    },
    {
      id: 'get_table',
      rest: { method: 'get', path: '/tabs/:id/table', handler: 'getTable' },
      mcp: {
        name: 'browser_get_table',
        description: 'Extract structured table data from a page as JSON. Works with native <table> elements automatically.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          selector: { type: 'string', description: 'CSS selector for the table or container element (default: "table")', default: 'table' },
          rowSelector: { type: 'string', description: 'For non-table layouts: CSS selector for row elements' },
          cellSelector: { type: 'string', description: 'For non-table layouts: CSS selector for cell elements' },
          llmFallback: { type: 'string', description: 'Natural language description of the table to extract' },
        },
        required: ['tabId'],
      },
    },
    {
      id: 'screenshot',
      label: 'Capture screenshot',
      chat: true,
      rest: { method: 'get', path: '/tabs/:id/screenshot', handler: 'screenshotTab' },
      mcp: {
        name: 'browser_screenshot',
        description: 'Capture a screenshot of a browser tab as a PNG. The viewport image is sized in CSS pixels, so any point on it can be passed straight to browser_click_at. marks=true draws each interactive element\'s ref number on the image (the same refs browser_click takes).',
        properties: {
          tabId: { type: 'number', description: 'The ID of the tab to screenshot' },
          fullPage: { type: 'boolean', description: 'If true, captures the entire scrollable page (not just viewport). Full-page pixels are document coordinates, not browser_click_at coordinates.', default: false },
          marks: { type: 'boolean', description: 'Overlay numbered boxes on the interactive elements (set-of-marks) and return their ref list', default: false },
          fullResolution: { type: 'boolean', description: 'Keep device pixels (e.g. 1.5x on a 150% display) instead of CSS pixels. Coordinates then need dividing by the reported scale before browser_click_at.', default: false },
        },
        required: ['tabId'],
      },
    },
    {
      id: 'get_console',
      rest: { method: 'get', path: '/tabs/:id/console', handler: 'getConsoleLogs' },
      mcp: {
        name: 'browser_get_console',
        description: 'Get console log messages from a browser tab. Returns the last 100 messages buffered since page load.',
        properties: {
          tabId: { type: 'number', description: 'The ID of the tab to get console logs from' },
          level: { type: 'string', enum: ['verbose', 'info', 'warning', 'error'], description: 'Filter by log level (optional)' },
        },
        required: ['tabId'],
      },
    },
    {
      id: 'get_network',
      rest: { method: 'get', path: '/tabs/:id/network', handler: 'getNetworkLog' },
      mcp: {
        name: 'browser_get_network',
        description: 'Get the network request log for the browser. Returns the last 100 HTTP requests/responses captured by the network interceptor.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          url: { type: 'string', description: 'Optional URL substring to filter results' },
        },
        required: ['tabId'],
      },
    },
    {
      id: 'handle_dialog',
      rest: { method: 'post', path: '/tabs/:id/dialog', handler: 'handleDialog' },
      mcp: {
        name: 'browser_handle_dialog',
        description: 'Configure automatic handling of JavaScript dialogs (alert, confirm, prompt) in a browser tab.',
        properties: {
          tabId: BrowserActions.TAB_ID,
          action: { type: 'string', enum: ['accept', 'dismiss'], description: 'Whether to accept or dismiss dialogs (default: accept)', default: 'accept' },
          promptText: { type: 'string', description: 'Text to return for prompt() dialogs when accepting' },
        },
        required: ['tabId'],
      },
    },
  ];

  static mcpToolDefinitions() {
    return BrowserActions._withSurface('mcp').map(BrowserActions._toMcpTool);
  }

  static restRoutes() {
    return BrowserActions._withSurface('rest').map((action) => ({ ...action.rest }));
  }

  static chatToolEntries() {
    return BrowserActions._withSurface('chat').map((action) => ({ name: action.id, label: action.label }));
  }

  static chatActionIds() {
    return BrowserActions._withSurface('chat').map((action) => action.id);
  }

  static _withSurface(surface) {
    return BrowserActions.ACTIONS.filter((action) => action[surface]);
  }

  static _toMcpTool(action) {
    return {
      name: action.mcp.name,
      description: action.mcp.description,
      inputSchema: {
        type: 'object',
        properties: action.mcp.properties || {},
        required: action.mcp.required || [],
      },
    };
  }
}

module.exports = BrowserActions;
