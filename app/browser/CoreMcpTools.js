const path = require('path');
const BrowserMcpTools = require('../../core/browser/BrowserMcpTools');
const DesktopMcpTools = require('../../core/desktop/DesktopMcpTools');
const GamesMcpTools = require('../../core/games/GamesMcpTools');
const GameController = require('../../core/games/GameController');
const GameSessionStore = require('../../core/games/GameSessionStore');
const GameService = require('../../core/games/GameService');
const DelegationTools = require('../../core/llm-server/chat/delegation/DelegationTools');
const ChatModeRegistry = require('../../core/llm-server/chat/ChatModeRegistry');
const AppGlobals = require('../AppGlobals');

class CoreMcpTools {
  static SOURCES = ['core.browser', 'core.desktop', 'core.games', 'core.delegation'];
  static GAMES_DIR = 'games';

  constructor(ctx) {
    this._ctx = ctx;
    this._s = ctx.services;
  }

  register({ browserService, llmFallbackService, desktopService }) {
    const mcp = this._s.mcpAggregator;
    mcp.registerCore('core.browser', {
      tools: BrowserMcpTools.TOOLS,
      handler: BrowserMcpTools.createDirectHandler(browserService, llmFallbackService, this._s.networkInterceptor),
    });
    mcp.registerCore('core.desktop', { tools: DesktopMcpTools.TOOLS, handler: new DesktopMcpTools(desktopService).handler() });
    mcp.registerCore('core.games', { tools: GamesMcpTools.TOOLS, handler: new GamesMcpTools(this._buildGames(desktopService)).handler() });
    const delegation = new DelegationTools({ getRouter: () => global.__lumaChatRouter || null, registry: ChatModeRegistry.shared });
    mcp.registerCore(DelegationTools.SOURCE, { tools: DelegationTools.TOOLS, handler: delegation.handler() });
    this._s.restGateway.mountMcpProxy(mcp);
    this._applyDisabledApiGroups();
  }

  _buildGames(desktopService) {
    const dir = path.join(this._ctx.app.getPath('userData'), CoreMcpTools.GAMES_DIR);
    const games = new GameService({ controller: new GameController({ desktop: desktopService }), store: new GameSessionStore({ dir }) });
    return AppGlobals.publish('__lumaGames', games);
  }

  _applyDisabledApiGroups() {
    const groups = this._s.db.get('core.disabledApiGroups', []);
    for (const groupId of Array.isArray(groups) ? groups : []) {
      if (typeof groupId === 'string' && groupId.startsWith('ext.')) this._s.restGateway.disableExtension(groupId.slice(4));
    }
  }
}

module.exports = CoreMcpTools;
