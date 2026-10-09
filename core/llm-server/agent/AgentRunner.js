const AgentRun = require('./AgentRun');
const AgentSystemPromptBuilder = require('./AgentSystemPromptBuilder');

class AgentRunner {
  constructor(llmService, services, db) {
    this._deps = {
      llm: llmService,
      browserTools: llmService ? llmService.browserTools : null,
      browserService: services ? services.browserService : null,
      db,
    };
  }

  run(options) {
    return new AgentRun(this._deps, options).execute();
  }

  buildSystemPrompt(options) {
    return new AgentSystemPromptBuilder(this._deps.db).build(options);
  }
}

module.exports = AgentRunner;
