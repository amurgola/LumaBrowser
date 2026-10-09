const AgentModels = require('./AgentModels');
const GrantableTools = require('./GrantableTools');

class AgentBundle {
  static FORMAT = 'luma-agent';
  static VERSION = 1;

  constructor(manager) {
    this._manager = manager;
  }

  export(agent) {
    return {
      format: AgentBundle.FORMAT,
      version: AgentBundle.VERSION,
      exportedAt: Date.now(),
      agent: {
        name: agent.name,
        description: agent.description || '',
        systemPrompt: agent.systemPrompt || '',
        tools: Array.isArray(agent.tools) ? agent.tools : [],
        modelRef: agent.modelRef || null,
      },
      knowledgeBase: { documents: this._manager.transfer.export(agent.id) },
    };
  }

  import(bundle) {
    AgentBundle._assertBundle(bundle);
    const src = bundle.agent;
    const warnings = [];
    const name = this._freeName(src.name, warnings);
    const tools = Array.isArray(src.tools) ? src.tools.filter((t) => typeof t === 'string') : [];
    AgentBundle._warnMissingTools(tools, warnings);
    AgentBundle._warnMissingModel(src.modelRef, warnings);
    const agent = this._manager.createAgent({
      name, description: src.description, systemPrompt: src.systemPrompt, tools, modelRef: src.modelRef || null,
    });
    const kb = this._importKnowledge(agent.id, bundle.knowledgeBase, warnings);
    return { agent: { ...agent, kbDocs: this._manager.knowledge.count(agent.id) }, warnings, kb };
  }

  static _assertBundle(bundle) {
    if (!bundle || typeof bundle !== 'object' || bundle.format !== AgentBundle.FORMAT
        || !bundle.agent || typeof bundle.agent !== 'object') {
      throw new Error('Not a Luma agent export file');
    }
  }

  _freeName(rawName, warnings) {
    const base = String(rawName || '').trim() || 'Imported agent';
    let name = base;
    for (let n = 2; this._manager.store.get(name); n++) name = `${base} (${n})`;
    if (name !== base) warnings.push(`An agent named "${base}" already exists, so it was imported as "${name}".`);
    return name;
  }

  static _warnMissingTools(tools, warnings) {
    const known = GrantableTools.availableNames();
    const missing = [...new Set(tools)].filter((t) => !known.has(t));
    if (!missing.length) return;
    warnings.push('These tools are not available on this system (missing extension or MCP connector), '
      + 'so the agent cannot use them yet: ' + missing.join(', ')
      + '. They will start working if the matching add-on is installed.');
  }

  static _warnMissingModel(modelRef, warnings) {
    if (!modelRef || AgentModels.isInstalled(modelRef)) return;
    warnings.push(`The model "${modelRef}" is not installed, so the agent will run on the app's default model until it is.`);
  }

  _importKnowledge(agentId, knowledgeBase, warnings) {
    const docs = knowledgeBase && Array.isArray(knowledgeBase.documents) ? knowledgeBase.documents : [];
    const empty = { documents: 0, chunks: 0, skipped: 0 };
    if (!docs.length) return empty;
    const result = this._manager.transfer.import(agentId, docs);
    if (result) return result;
    warnings.push('The knowledge base service is not available on this build, so '
      + docs.length + ' knowledge document' + (docs.length === 1 ? ' was' : 's were') + ' not imported.');
    return empty;
  }
}

module.exports = AgentBundle;
