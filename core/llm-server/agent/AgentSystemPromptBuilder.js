const AgentPromptText = require('./AgentPromptText');
const SystemPromptRenderer = require('./SystemPromptRenderer');

class AgentSystemPromptBuilder {
  static USER_PROMPT_SETTING = 'aiChat.systemPrompt';
  static NO_EXEC_RULES = 'no-exec-rules';

  constructor(db) {
    this._db = db;
  }

  build(options) {
    const ctx = this._renderContext(options);
    const override = options.systemPromptOverride;
    if (override == null) return SystemPromptRenderer.render(ctx);
    if (typeof override === 'function') return override(ctx);
    return AgentSystemPromptBuilder._withAppend(String(override), ctx.append);
  }

  _renderContext(options) {
    const experiments = new Set(Array.isArray(options.promptExperiments) ? options.promptExperiments : []);
    const userCustom = this._userCustom();
    const systemPromptAppend = options.systemPromptAppend || '';
    return {
      tabInfo: options.tabInfo,
      defaultTabId: options.defaultTabId,
      allowedTools: options.allowedTools || null,
      tools: AgentSystemPromptBuilder._toolLines(options),
      userCustom,
      systemPromptAppend,
      append: [userCustom, systemPromptAppend].filter(Boolean).join('\n'),
      noBrowser: !!options.noBrowser,
      parallelToolCalls: !!options.parallelToolCalls,
      omitExecRules: experiments.has(AgentSystemPromptBuilder.NO_EXEC_RULES),
    };
  }

  static _toolLines(options) {
    if (options.noBrowser) return [];
    const lines = AgentPromptText.browserToolLines(options.defaultTabId);
    const allowed = options.allowedTools;
    if (!allowed) return lines;
    return lines.filter((line) => {
      const match = line.match(/^- (\w+):/);
      return match && allowed.includes(match[1]);
    });
  }

  static _withAppend(base, append) {
    return append ? `${base}\n\nADDITIONAL INSTRUCTIONS:\n${append}` : base;
  }

  _userCustom() {
    const db = this._db;
    if (!db || typeof db.get !== 'function') return '';
    return db.get(AgentSystemPromptBuilder.USER_PROMPT_SETTING, '');
  }
}

module.exports = AgentSystemPromptBuilder;
