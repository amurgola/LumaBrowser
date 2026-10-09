const McpResult = require('../shell/McpResult');

class GamesMcpTools {
  static TOOLS = [
    {
      name: 'game_start_session',
      description: 'Start or resume playing a game in a desktop window. Returns the saved profile for that game: goals, learned controls, notes, macros, step count and whether the user has allowed game mode for it. Call this first, and again after a context reset. Works best with turn-based or pausable games in borderless windowed mode.',
      inputSchema: {
        type: 'object',
        properties: {
          hwnd: { type: 'number', description: 'Game window handle from desktop_list_windows (preferred)' },
          window: { type: 'string', description: 'Or: text in the game window title (must match one window)' },
          gameId: { type: 'string', description: 'Optional profile id; defaults to the game executable name' },
        },
        required: [],
      },
    },
    {
      name: 'game_allow',
      mutating: true,
      description: 'Ask the user to allow game mode (automated keyboard and mouse input) for the current game. Required once per game before any input. Games with anti-cheat are always refused.',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'game_set_goals',
      description: 'Save the goals for the current game (kept on disk across resets): primary = the long-term objective, secondary = the current milestone, tertiary = the immediate next thing to do.',
      inputSchema: {
        type: 'object',
        properties: {
          primary: { type: 'string' },
          secondary: { type: 'string' },
          tertiary: { type: 'string' },
        },
        required: [],
      },
    },
    {
      name: 'game_note',
      description: 'Save a note to the game profile. kind "control" with key and action records a control ("space" = "jump"). kind "summary" is the periodic progress summary game_status asks for.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The note' },
          kind: { type: 'string', enum: ['note', 'summary', 'control'], description: 'Default note' },
          key: { type: 'string', description: 'For kind control: the key, e.g. "e"' },
          action: { type: 'string', description: 'For kind control: what it does, e.g. "interact"' },
        },
        required: [],
      },
    },
    {
      name: 'game_press',
      mutating: true,
      description: 'Press keys in the game, sent as hardware scan codes and held long enough for the game to see them. One key or combo ("space", "shift+w", "up"), or a sequence separated by spaces ("down down enter").',
      inputSchema: {
        type: 'object',
        properties: {
          keys: { type: 'string', description: 'Key, combo, or space-separated sequence' },
          holdMs: { type: 'number', description: 'How long each key is held (default 60)' },
          gapMs: { type: 'number', description: 'Pause between keys of a sequence (default 80)' },
          mode: { type: 'string', enum: ['scan', 'vk'], description: 'scan (default, what games read) or vk (virtual keys, for apps that ignore scan codes)' },
        },
        required: ['keys'],
      },
    },
    {
      name: 'game_hold',
      mutating: true,
      description: 'Hold one key (or combo) down for a duration, e.g. walk forward with "w" for 800 ms.',
      inputSchema: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Key or combo' },
          ms: { type: 'number', description: 'Hold time in ms (default 500, max 10000)' },
          mode: { type: 'string', enum: ['scan', 'vk'] },
        },
        required: ['key'],
      },
    },
    {
      name: 'game_mouse_move',
      mutating: true,
      description: 'Move the mouse by a relative amount (turns the camera in mouse-look games), spread over durationMs. Run game_calibrate_mouse once to check the game reacts to it.',
      inputSchema: {
        type: 'object',
        properties: {
          dx: { type: 'number', description: 'Right is positive' },
          dy: { type: 'number', description: 'Down is positive' },
          durationMs: { type: 'number', description: 'Default 200' },
        },
        required: [],
      },
    },
    {
      name: 'game_click',
      mutating: true,
      description: 'Click in the game (menus, cards, map tiles) at x/y pixels of the latest game_wait screenshot, or by description (a vision model finds it).',
      inputSchema: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          description: { type: 'string', description: 'What to click, described visually' },
          button: { type: 'string', enum: ['left', 'right', 'middle'] },
          double: { type: 'boolean' },
        },
        required: [],
      },
    },
    {
      name: 'game_wait',
      description: 'Wait until the game screen settles (for "still", default: animations and enemy turns are over) or changes (for "change"), then return a screenshot. Use after every action before planning the next.',
      inputSchema: {
        type: 'object',
        properties: {
          for: { type: 'string', enum: ['still', 'change'] },
          timeoutMs: { type: 'number', description: 'Give up after this long (default 5000 for still, 3000 for change)' },
          stableMs: { type: 'number', description: 'For still: how long the screen must not change (default 500)' },
          screenshot: { type: 'boolean', description: 'Return a screenshot (default true)' },
        },
        required: [],
      },
    },
    {
      name: 'game_calibrate_mouse',
      mutating: true,
      description: 'Nudge the mouse sideways and back and report whether the game view reacted (tells whether mouse-look input works in this game).',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'game_save_macro',
      description: 'Save a reusable sequence of actions for this game. steps: [{"press":"down","holdMs":60}, {"hold":"w","ms":800}, {"mouse":{"dx":200,"dy":0}}, {"click":{"x":100,"y":200}}, {"wait":"still"}, {"wait":300}].',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'a-z, 0-9, _ or -' },
          steps: { type: 'array', description: 'Action steps', items: { type: 'object' } },
        },
        required: ['name', 'steps'],
      },
    },
    {
      name: 'game_run_macro',
      mutating: true,
      description: 'Run a saved macro for this game. Stops at the first step that fails.',
      inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
    },
    {
      name: 'game_status',
      description: 'Current game session: step count, goals, whether the agent looks stuck (the screen stopped changing after its inputs) with a suggestion, and whether a progress summary is due.',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
  ];

  constructor(games) {
    this._games = games;
    this._routes = this._buildRoutes();
  }

  handler() {
    return (name, args) => this.handle(name, args);
  }

  async handle(name, args = {}) {
    const route = this._routes[name];
    if (!route) return McpResult.error(`Unknown game tool: ${name}`);
    try {
      return await route(args);
    } catch (e) {
      return McpResult.error(e.message || 'game tool failed');
    }
  }

  _buildRoutes() {
    const g = this._games;
    const reply = GamesMcpTools._reply;
    return {
      game_start_session: (args) => GamesMcpTools._startReply(g.start(args)),
      game_allow: () => reply(g.allow()),
      game_set_goals: (args) => reply(g.setGoals(args)),
      game_note: (args) => reply(g.note(args)),
      game_press: async (args) => reply(await g.press(args)),
      game_hold: async (args) => reply(await g.hold(args)),
      game_mouse_move: async (args) => reply(await g.mouseMove(args)),
      game_click: async (args) => reply(await g.click(args)),
      game_calibrate_mouse: async (args) => reply(await g.calibrateMouse(args)),
      game_wait: async (args) => GamesMcpTools._waitReply(await g.wait(args)),
      game_save_macro: (args) => reply(g.saveMacro(args)),
      game_run_macro: async (args) => reply(await g.runMacro(args)),
      game_status: () => reply(g.status()),
    };
  }

  static _reply(r) {
    return r.success ? McpResult.text({ success: true, data: r.data }) : McpResult.error(r.error || 'game action failed');
  }

  static _startReply(r) {
    return r.success ? { content: [{ type: 'text', text: r.data.text }] } : McpResult.error(r.error);
  }

  static _waitReply(r) {
    if (!r.success) return McpResult.error(r.error);
    const { image, ...rest } = r.data;
    const summary = { success: true, data: rest };
    if (!image) return McpResult.text(summary);
    const f = image.frame;
    return {
      content: [
        { type: 'image', data: image.screenshot, mimeType: image.mimeType || 'image/png' },
        { type: 'text', text: `${JSON.stringify(summary)}\nScreenshot ${f.imageWidth}x${f.imageHeight} px; game_click x/y use these pixels.` },
      ],
    };
  }
}

module.exports = GamesMcpTools;
