const McpResult = require('../shell/McpResult');

class DesktopMcpTools {
  static WINDOW = {
    hwnd: { type: 'number', description: 'Window handle from desktop_list_windows (preferred)' },
    window: { type: 'string', description: 'Or: text that appears in the window title (must match exactly one window)' },
  };

  static TOOLS = [
    {
      name: 'desktop_list_windows',
      description: 'List the open application windows on the user\'s desktop (hwnd, title, app, position). Windows marked antiCheat or elevated cannot be controlled. Windows marked systemPrompt (UAC, Windows Security sign-in, lock screen) are for the user to answer; humanNeeded means Windows is waiting for the user and no input is possible until they deal with it.',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'desktop_observe',
      description: 'List a window\'s buttons, fields, menus and other controls as numbered refs, read from Windows UI Automation. Clicking a ref works without taking over the mouse. Games and custom-drawn apps expose nothing here: use desktop_screenshot + desktop_click with a description instead.',
      inputSchema: { type: 'object', properties: { ...DesktopMcpTools.WINDOW }, required: [] },
    },
    {
      name: 'desktop_screenshot',
      description: 'Screenshot one window (or the whole desktop when no window is given). Pixel coordinates on the image can be passed to desktop_click x/y for that window.',
      inputSchema: { type: 'object', properties: { ...DesktopMcpTools.WINDOW }, required: [] },
    },
    {
      name: 'desktop_click',
      mutating: true,
      description: 'Click in a window by ref (from desktop_observe, preferred), by x/y (pixels of the latest desktop_screenshot of that window), or by description (a vision model finds it on the window, e.g. "the Play button"). x/y and description clicks bring the window to the front and briefly move the mouse; the result\'s hit says what was under the pointer. A ref click is refused (code COVERED) when something else is on top of the element. Code HUMAN_NEEDED means a UAC / sign-in prompt or the lock screen is up: ask the user.',
      inputSchema: {
        type: 'object',
        properties: {
          ...DesktopMcpTools.WINDOW,
          ref: { type: 'number', description: 'Element ref from desktop_observe' },
          x: { type: 'number', description: 'Pixel x in the latest desktop_screenshot of this window' },
          y: { type: 'number', description: 'Pixel y in the latest desktop_screenshot of this window' },
          description: { type: 'string', description: 'What to click, described visually' },
          button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button (default left)' },
          double: { type: 'boolean', description: 'Double click' },
        },
        required: [],
      },
    },
    {
      name: 'desktop_type',
      mutating: true,
      description: 'Type text into a window. With ref (a text field from desktop_observe) the value is set directly; otherwise the window is brought to the front and the text is typed as keystrokes into whatever has focus (long text and Chinese/Japanese/Korean are pasted via the clipboard, which is restored after). submit=true presses Enter after.',
      inputSchema: {
        type: 'object',
        properties: {
          ...DesktopMcpTools.WINDOW,
          text: { type: 'string', description: 'Text to type' },
          ref: { type: 'number', description: 'Text field ref from desktop_observe' },
          submit: { type: 'boolean', description: 'Press Enter after typing' },
          mode: { type: 'string', enum: ['auto', 'keys', 'paste'], description: 'auto (default): set the value by ref, else keystrokes, else paste for long/CJK text. keys: always keystrokes. paste: always clipboard paste.' },
        },
        required: ['text'],
      },
    },
    {
      name: 'desktop_drag',
      mutating: true,
      description: 'Drag with the mouse inside a window: press at "from", move in steps, release at "to" (sliders, drag-and-drop, reordering, drawing). Each end is { ref } from desktop_observe or { x, y } pixels of the latest desktop_screenshot of that window. Brings the window to the front.',
      inputSchema: {
        type: 'object',
        properties: {
          ...DesktopMcpTools.WINDOW,
          from: { type: 'object', description: 'Start point: { ref } or { x, y }', properties: { ref: { type: 'number' }, x: { type: 'number' }, y: { type: 'number' } } },
          to: { type: 'object', description: 'End point: { ref } or { x, y }', properties: { ref: { type: 'number' }, x: { type: 'number' }, y: { type: 'number' } } },
          button: { type: 'string', enum: ['left', 'right', 'middle'], description: 'Mouse button (default left)' },
          steps: { type: 'number', description: 'Intermediate moves (default 15)' },
          durationMs: { type: 'number', description: 'Time spent moving (default 300)' },
        },
        required: ['from', 'to'],
      },
    },
    {
      name: 'desktop_set_value',
      mutating: true,
      description: 'Set a slider, spinner or field by ref (from desktop_observe) directly through UI Automation, without the mouse: a number for sliders/spinners (must be inside their range), text for fields.',
      inputSchema: {
        type: 'object',
        properties: {
          ...DesktopMcpTools.WINDOW,
          ref: { type: 'number', description: 'Element ref from desktop_observe' },
          value: { type: 'string', description: 'New value, e.g. "75" for a slider or text for a field' },
        },
        required: ['ref', 'value'],
      },
    },
    {
      name: 'desktop_press_key',
      mutating: true,
      description: 'Press a key or combination in a window, e.g. "enter", "esc", "ctrl+s", "alt+f", "ctrl+shift+t", "f5", "down".',
      inputSchema: { type: 'object', properties: { ...DesktopMcpTools.WINDOW, keys: { type: 'string', description: 'Key combo joined with +' } }, required: ['keys'] },
    },
    {
      name: 'desktop_scroll',
      mutating: true,
      description: 'Scroll with the mouse wheel over a window (at x/y from its latest screenshot, else its centre).',
      inputSchema: {
        type: 'object',
        properties: {
          ...DesktopMcpTools.WINDOW,
          direction: { type: 'string', enum: ['up', 'down', 'left', 'right'], description: 'Default down' },
          amount: { type: 'number', description: 'Wheel notches (default 3)' },
          x: { type: 'number' },
          y: { type: 'number' },
        },
        required: [],
      },
    },
    {
      name: 'desktop_focus',
      mutating: true,
      description: 'Bring a window to the front (restoring it if minimized).',
      inputSchema: { type: 'object', properties: { ...DesktopMcpTools.WINDOW }, required: [] },
    },
  ];

  constructor(desktop) {
    this._desktop = desktop;
    this._routes = this._buildRoutes();
  }

  handler() {
    return (name, args) => this.handle(name, args);
  }

  async handle(name, args = {}) {
    const route = this._routes[name];
    if (!route) return McpResult.error(`Unknown desktop tool: ${name}`);
    try {
      return await route(args);
    } catch (e) {
      return McpResult.error(e.message || 'desktop tool failed');
    }
  }

  _buildRoutes() {
    const d = this._desktop;
    return {
      desktop_list_windows: () => DesktopMcpTools._reply(d.listWindows()),
      desktop_observe: async (args) => DesktopMcpTools._observeReply(await d.observe(args)),
      desktop_screenshot: (args) => DesktopMcpTools._screenshotReply(d.screenshot(args)),
      desktop_click: async (args) => DesktopMcpTools._reply(await d.click(args)),
      desktop_type: async (args) => DesktopMcpTools._reply(await d.type(args)),
      desktop_drag: async (args) => DesktopMcpTools._reply(await d.drag(args)),
      desktop_set_value: async (args) => DesktopMcpTools._reply(await d.setValue(args)),
      desktop_press_key: async (args) => DesktopMcpTools._reply(await d.pressKey(args)),
      desktop_scroll: async (args) => DesktopMcpTools._reply(await d.scroll(args)),
      desktop_focus: (args) => DesktopMcpTools._reply(d.focus(args)),
    };
  }

  static _reply(r) {
    if (r.success) return McpResult.text({ success: true, data: r.data });
    if (r.code) return DesktopMcpTools._codedError(r);
    return McpResult.error(r.error || 'desktop action failed');
  }

  static _codedError(r) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ success: false, error: r.error, code: r.code }, null, 2) }],
      isError: true,
    };
  }

  static _observeReply(r) {
    return r.success ? { content: [{ type: 'text', text: r.data.text }] } : McpResult.error(r.error);
  }

  static _screenshotReply(r) {
    if (!r.success) return McpResult.error(r.error);
    const f = r.data.frame;
    const hint = f.hwnd ? ` (hwnd ${f.hwnd}); desktop_click x/y use these pixels` : '';
    return {
      content: [
        { type: 'image', data: r.data.screenshot, mimeType: 'image/png' },
        { type: 'text', text: `Screenshot of ${r.data.title}: ${f.imageWidth}x${f.imageHeight} px${hint}.` },
      ],
    };
  }
}

module.exports = DesktopMcpTools;
