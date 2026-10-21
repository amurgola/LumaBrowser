const ToolNames = require('../spec/ToolNames');
const ParamTemplate = require('../spec/ParamTemplate');
const EndpointSpec = require('../spec/EndpointSpec');
const Faults = require('../spec/Faults');
const McpReply = require('./McpReply');

class SiteApiToolHost {
  static SOURCE_ID = 'site-apis-endpoints';
  static LIVE_STATUS = 'validated';
  static LLM_NOTE = 'Uses an LLM transform step, so the result is shaped by a model and may vary between calls.';

  constructor({ store, run, getAggregator, logger } = {}) {
    this._store = store;
    this._run = run;
    this._getAggregator = getAggregator;
    this._logger = logger || console;
    this._byName = new Map();
    this._registered = false;
  }

  buildToolSet() {
    const byName = new Map();
    const tools = [];
    for (const site of this._store.listSites()) {
      for (const endpoint of this._store.listEndpoints(site.id)) {
        if (endpoint.status !== SiteApiToolHost.LIVE_STATUS) continue;
        const definition = SiteApiToolHost.definition(site, endpoint);
        byName.set(definition.name, { siteId: site.id, endpointName: endpoint.name });
        tools.push(definition);
      }
    }
    this._byName = byName;
    return { tools, handler: (name, args, opts) => this.handle(name, args, opts) };
  }

  refresh() {
    const aggregator = this._aggregator();
    const toolSet = this.buildToolSet();
    if (!aggregator) return false;
    aggregator.registerExtension(SiteApiToolHost.SOURCE_ID, toolSet);
    this._registered = true;
    return true;
  }

  async handle(name, args = {}, opts = {}) {
    const target = this._byName.get(name);
    if (!target) return McpReply.error(`Unknown Site API tool "${name}".`);
    let result;
    try {
      result = await this._run(target.siteId, target.endpointName, args || {}, { kind: 'call', signal: opts.signal });
    } catch (err) {
      this._logger.error(`site-apis: tool ${name} threw: ${err && err.message}`);
      return McpReply.error(err && err.message ? err.message : String(err));
    }
    return SiteApiToolHost.reply(result);
  }

  dispose() {
    const aggregator = this._aggregator();
    if (aggregator && this._registered && typeof aggregator.unregisterExtension === 'function') {
      try { aggregator.unregisterExtension(SiteApiToolHost.SOURCE_ID); } catch (_) {}
    }
    this._registered = false;
    this._byName = new Map();
  }

  targets() {
    return new Map(this._byName);
  }

  static reply(result) {
    if (!result || typeof result !== 'object') return McpReply.error('The endpoint answered nothing.');
    if (result.success) {
      const out = { success: true, data: result.data === undefined ? null : result.data };
      if (result.runId) out.runId = result.runId;
      if (result.durationMs != null) out.durationMs = result.durationMs;
      if (Array.isArray(result.healed) && result.healed.length) out.healed = result.healed;
      return McpReply.ok(out);
    }
    const fault = result.fault || Faults.make(Faults.STEP_FAILED, result.error || 'The endpoint failed.');
    const out = { success: false, fault, advice: result.advice || Faults.advice(fault) };
    if (result.runId) out.runId = result.runId;
    if (result.durationMs != null) out.durationMs = result.durationMs;
    return McpReply.fault(out);
  }

  static definition(site, endpoint) {
    return {
      name: ToolNames.endpointTool(site, endpoint),
      description: SiteApiToolHost.describe(site, endpoint),
      inputSchema: ParamTemplate.inputSchema(endpoint.params),
    };
  }

  static describe(site, endpoint) {
    const base = String(endpoint.description || '').trim() || `Endpoint ${endpoint.name} of ${site.name}`;
    const returns = endpoint.returns || {};
    const kind = returns.kind || 'object';
    const fields = Array.isArray(returns.fields) && returns.fields.length ? ` with fields ${returns.fields.join(', ')}` : '';
    const note = EndpointSpec.usesLlm(endpoint.steps) ? ` ${SiteApiToolHost.LLM_NOTE}` : '';
    return `${base} (Site API on ${site.name}; returns ${kind}${fields})${note}`;
  }

  _aggregator() {
    try {
      const aggregator = typeof this._getAggregator === 'function' ? this._getAggregator() : null;
      return aggregator && typeof aggregator.registerExtension === 'function' ? aggregator : null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = SiteApiToolHost;
