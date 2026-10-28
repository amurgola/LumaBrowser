const McpResult = require('../shell/McpResult');

class DesktopMcpTools {
  static WINDOW = {
    hwnd: { type: 'number', description: 'Window handle from desktop_list_windows (preferred). 0 = the whole desktop (taskbar, Start menu, tray), for screenshot, click, type, press_key and scroll' },
    window: { type: 'string', description: 'Or: text that appears in the window title (must match exactly one window)' },
  };

  static LOOK = {
    look: { type: 'boolean', description: 'Reply with a screenshot of the window after the action (default true). false skips it.' },
  };

  static LOOKING = new Set(['desktop_click', 'desktop_type', 'desktop_drag', 'desktop_press_key', 'desktop_scroll']);

  static TOOLS = [
    {
      name: 'desktop_list_windows',
      description: 'List the open application windows on the user\'s desktop (hwnd, title, app, position). Dialogs such as Run or Save As are included, marked dialog. Windows marked antiCheat or elevated cannot be controlled. Windows marked systemPrompt (UAC, Windows Security sign-in, lock screen) are for the user to answer; humanNeeded means Windows is waiting for the user and no input is possible until they deal with it.',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'desktop_observe',
      description: 'List a window\'s buttons, fields, menus and other controls as numbered refs, read from Windows UI Automation. Clicking a ref works without taking over the mouse. Games and custom-drawn apps expose nothing here: use desktop_screenshot + desktop_click with a description instead.',
      inputSchema: { type: 'object', properties: { ...DesktopMcpTools.WINDOW }, required: [] },
    },
    {
      name: 'desktop_screenshot',
      description: 'Screenshot one window (or the whole desktop when no window is given, or hwnd 0). Pixel coordinates on the image can be passed to desktop_click / desktop_scroll x/y with the same hwnd (0 for a whole-desktop screenshot). Click, type, press_key, scroll and drag already reply with a fresh screenshot: call this only to look without acting. Act on what you see: when what you need is not on screen, scroll and look again before searching. When the screen asks a personal choice the user did not make (which profile or account), ask them.',
      inputSchema: { type: 'object', properties: { ...DesktopMcpTools.WINDOW }, required: [] },
    },
    {
      name: 'desktop_click',
      mutating: true,
      description: 'Click in a window by ref (from desktop_observe, preferred), by x/y (pixels of the latest screenshot of that window, from desktop_screenshot or an action reply), or by description (a vision model finds it on the window, e.g. "the Play button"). Use description whenever desktop_observe has no ref for what you want: video players, canvases, games, custom-drawn apps. Pass ref AND description to have the description tried when the ref fails. hwnd 0 clicks anywhere on the desktop (taskbar, Start menu, tray icons) by x/y of a whole-desktop screenshot or by description. x/y and description clicks bring the window to the front and briefly move the mouse; the result\'s hit says what was under the pointer. A ref click is refused (code COVERED) when something else is on top of the element. Code HUMAN_NEEDED means a UAC / sign-in prompt or the lock screen is up: ask the user. The reply includes a screenshot of the window after the click.',
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
          ...DesktopMcpTools.LOOK,
        },
        required: [],
      },
    },
    {
      name: 'desktop_type',
      mutating: true,
      description: 'Type text into a window. With ref (a text field from desktop_observe) the value is set directly; otherwise the window is brought to the front and the text is typed as keystrokes into whatever has focus (long text and Chinese/Japanese/Korean are pasted via the clipboard, which is restored after). hwnd 0 types into whatever window is already in front without changing it. submit=true presses Enter after. On a website, type into the site\'s own search box: a URL you made up typed into the address bar is still a guess. navigate / click / type with a tabId act on LumaBrowser\'s own tabs, never on this window.',
      inputSchema: {
        type: 'object',
        properties: {
          ...DesktopMcpTools.WINDOW,
          text: { type: 'string', description: 'Text to type' },
          ref: { type: 'number', description: 'Text field ref from desktop_observe' },
          submit: { type: 'boolean', description: 'Press Enter after typing' },
          mode: { type: 'string', enum: ['auto', 'keys', 'paste'], description: 'auto (default): set the value by ref, else keystrokes, else paste for long/CJK text. keys: always keystrokes. paste: always clipboard paste.' },
          ...DesktopMcpTools.LOOK,
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
          ...DesktopMcpTools.LOOK,
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
      description: 'Press a key or combination in a window, e.g. "enter", "esc", "ctrl+s", "alt+f", "ctrl+shift+t", "f5", "down". When the combo brings up another window (a dialog, a new window), the reply\'s nowInFront names it: target that hwnd next.',
      inputSchema: { type: 'object', properties: { ...DesktopMcpTools.WINDOW, keys: { type: 'string', description: 'Key combo joined with +' }, ...DesktopMcpTools.LOOK }, required: ['keys'] },
    },
    {
      name: 'desktop_scroll',
      mutating: true,
      description: 'Scroll with the mouse wheel over a window: at x/y from its latest screenshot, over a description a vision model finds (e.g. "the episode list"), else its centre. At most 10 notches per call; the reply shows where it landed. Before scrolling through a long list, look for its sort, season or filter controls.',
      inputSchema: {
        type: 'object',
        properties: {
          ...DesktopMcpTools.WINDOW,
          direction: { type: 'string', enum: ['up', 'down', 'left', 'right'], description: 'Default down' },
          amount: { type: 'number', description: 'Wheel notches (default 3, at most 10)' },
          x: { type: 'number' },
          y: { type: 'number' },
          description: { type: 'string', description: 'What to scroll over, described visually' },
          ...DesktopMcpTools.LOOK,
        },
        required: [],
      },
    },
    {
      name: 'desktop_launch',
      mutating: true,
      description: 'Open an app on the user\'s desktop, the way the Run dialog does: a program name ("msedge", "notepad", "spotify"), a full path, a file, a folder or a URL. args are passed to the program (e.g. a URL for a browser). Replies with the new window(s) and their hwnd. Use this instead of the Start menu or Win+R. For a website pass its home page and work from there with the site\'s own search box and menus, like a person would: never guess deep links or search-URL parameters.',
      inputSchema: {
        type: 'object',
        properties: {
          app: { type: 'string', description: 'Program name, path, file or URL' },
          args: { type: 'string', description: 'Command-line arguments, e.g. "https://www.crunchyroll.com"' },
        },
        required: ['app'],
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
      desktop_click: async (args) => this._acted(args, await d.click(args)),
      desktop_type: async (args) => this._acted(args, await d.type(args)),
      desktop_drag: async (args) => this._acted(args, await d.drag(args)),
      desktop_set_value: async (args) => DesktopMcpTools._reply(await d.setValue(args)),
      desktop_press_key: async (args) => this._acted(args, await d.pressKey(args)),
      desktop_scroll: async (args) => this._acted(args, await d.scroll(args)),
      desktop_focus: async (args) => DesktopMcpTools._reply(await d.focus(args)),
      desktop_launch: async (args) => DesktopMcpTools._reply(await d.launch(args)),
    };
  }

  async _acted(args, r) {
    const reply = DesktopMcpTools._reply(r);
    if (!r.success) return reply;
    let look = null;
    try { look = await this._desktop.lookAfter(args, r); } catch (_) { look = null; }
    if (!look || !look.success) return reply;
    const shot = DesktopMcpTools._screenshotReply(look, 'After the action: screenshot');
    return { ...reply, content: [...reply.content, ...shot.content] };
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

  static _screenshotReply(r, lead = 'Screenshot') {
    if (!r.success) return McpResult.error(r.error);
    const f = r.data.frame;
    const hint = f.hwnd ? ` (hwnd ${f.hwnd}); desktop_click x/y use these pixels` : ' (hwnd 0); desktop_click x/y with hwnd 0 use these pixels';
    return {
      content: [
        { type: 'image', data: r.data.screenshot, mimeType: 'image/png' },
        { type: 'text', text: `${lead} of ${r.data.title}: ${f.imageWidth}x${f.imageHeight} px${hint}.` },
      ],
    };
  }
}

module.exports = DesktopMcpTools;
