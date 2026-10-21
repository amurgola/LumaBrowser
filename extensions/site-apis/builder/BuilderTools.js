const ToolNames = require('../spec/ToolNames');
const Faults = require('../spec/Faults');
const BuilderMeta = require('./BuilderMeta');
const BuilderToolSpecs = require('./BuilderToolSpecs');
const PersistedTabs = require('./PersistedTabs');
const RecordedCalls = require('./RecordedCalls');
const SiteBinding = require('./SiteBinding');
const TraceCompiler = require('./TraceCompiler');

class BuilderTools {
  static DATA_CHARS = 2000;
  static NOT_BOUND = 'this conversation is not bound to a site yet: call list_persisted_tabs, then use_tab';
  static NO_ENDPOINT = 'no current endpoint: call define_endpoint first (or pass name)';
  static NOTHING_RECORDED = 'no page tool calls recorded since define_endpoint. Demonstrate the endpoint first on the work tab with the example values, passing a selector and an llmFallback description with every click, type, press_key, select_option, wait_for, get_element and extract_data, then call compile_endpoint again.';

  constructor({ service, browser = null, getChatStore = null, logger = console } = {}) {
    this._service = service;
    this._browser = browser;
    this._getChatStore = getChatStore;
    this._logger = logger;
  }

  build() {
    const handlers = {
      [BuilderToolSpecs.LIST_PERSISTED_TABS]: (p, c) => this.listPersistedTabs(p, c),
      [BuilderToolSpecs.USE_TAB]: (p, c) => this.useTab(p, c),
      [BuilderToolSpecs.DEFINE_SITE]: (p, c) => this.defineSite(p, c),
      [BuilderToolSpecs.DEFINE_ENDPOINT]: (p, c) => this.defineEndpoint(p, c),
      [BuilderToolSpecs.COMPILE_ENDPOINT]: (p, c) => this.compileEndpoint(p, c),
      [BuilderToolSpecs.SET_STEPS]: (p, c) => this.setSteps(p, c),
      [BuilderToolSpecs.GET_ENDPOINT]: (p, c) => this.getEndpoint(p, c),
      [BuilderToolSpecs.TEST_ENDPOINT]: (p, c) => this.testEndpoint(p, c),
      [BuilderToolSpecs.SAVE_ENDPOINT]: (p, c) => this.saveEndpoint(p, c),
      [BuilderToolSpecs.LIST_ENDPOINTS]: (p, c) => this.listEndpoints(p, c),
    };
    return BuilderToolSpecs.all().map((spec) => ({ ...spec, handler: handlers[spec.name] }));
  }


  listPersistedTabs() {
    const tabs = PersistedTabs.list(this._browser);
    if (!tabs.length) return { success: true, tabs: [], note: 'No persisted tab is open. Ask the user to open the site, sign in, and persist the tab (tab menu), then call this again.' };
    return { success: true, tabs };
  }

  useTab(params = {}, ctx = {}) {
    const conversationId = ctx.conversationId;
    if (!conversationId) return { success: false, error: 'no conversation for this turn' };
    const tab = PersistedTabs.find(this._browser, params.tabId);
    if (!tab) return { success: false, error: `no persisted tab with id ${params.tabId}; call list_persisted_tabs` };
    const store = this._chatStore();
    const data = BuilderMeta.merge(BuilderMeta.read(store, conversationId), { partition: tab.partition, origin: tab.origin, startUrl: tab.url, sourceTabId: tab.tabId, siteId: null });
    const { site, patch } = SiteBinding.resolve(this._service, conversationId, data);
    if (!site) return { success: false, error: 'the site record could not be created for that tab' };
    BuilderMeta.patch(store, conversationId, { ...data, ...patch });
    this._rename(conversationId, site);
    return { success: true, site: BuilderTools._siteView(site), note: 'Bound. The work tab opens on the next turn: end your reply now and ask the user to continue.' };
  }

  defineSite(params = {}, ctx = {}) {
    const bound = this._bound(ctx);
    if (!bound.site) return { success: false, error: BuilderTools.NOT_BOUND };
    const patch = {};
    if (params.name != null) patch.name = String(params.name);
    if (params.startUrl != null) patch.startUrl = String(params.startUrl);
    if (params.login !== undefined) patch.login = { ...bound.site.login, ...(params.login || {}) };
    try {
      const site = this._service.updateSite(bound.site.id, patch);
      if (patch.startUrl) BuilderMeta.patch(this._chatStore(), ctx.conversationId, { startUrl: patch.startUrl });
      if (patch.name) this._rename(ctx.conversationId, site);
      return { success: true, site: BuilderTools._siteView(site) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }


  defineEndpoint(params = {}, ctx = {}) {
    const bound = this._bound(ctx);
    if (!bound.site) return { success: false, error: BuilderTools.NOT_BOUND };
    const name = String(params.name || '').trim();
    const definition = {
      siteId: bound.site.id,
      name,
      description: String(params.description || ''),
      params: Array.isArray(params.params) ? params.params : [],
      returns: params.returns || undefined,
      steps: [{ kind: 'navigate', url: bound.site.startUrl, note: 'placeholder until compile_endpoint or set_steps' }],
      status: 'draft',
    };
    let endpoint;
    try {
      const existing = this._service.getEndpointByName(bound.site.id, name);
      endpoint = existing
        ? this._service.updateEndpoint(existing.id, { description: definition.description, params: definition.params, returns: definition.returns, status: 'draft' })
        : this._service.createEndpoint(definition);
    } catch (err) {
      return { success: false, error: err.message };
    }
    const recording = { endpointId: endpoint.id, name: endpoint.name, messageId: ctx.assistantMessageId || null, at: new Date().toISOString() };
    BuilderMeta.patch(this._chatStore(), ctx.conversationId, { endpointId: endpoint.id, recording, returnsDeclared: !!params.returns });
    return {
      success: true,
      endpoint: BuilderTools._endpointView(bound.site, endpoint),
      recording: true,
      note: 'Recording started. Demonstrate on the work tab with the example values, passing a selector and an llmFallback description with every click, type, wait_for, get_element and extract_data, then call compile_endpoint in this same reply.',
    };
  }

  compileEndpoint(params = {}, ctx = {}) {
    const found = this._endpointFor(params, ctx);
    if (found.error) return { success: false, error: found.error };
    const { site, endpoint, data } = found;
    const recording = data.recording && data.recording.endpointId === endpoint.id ? data.recording : { at: endpoint.createdAt, name: endpoint.name };
    const calls = RecordedCalls.collect(this._chatStore(), ctx.conversationId, recording, { excludeMessageId: ctx.assistantMessageId, trace: ctx.trace || null });
    if (!calls.length) return { success: false, error: BuilderTools.NOTHING_RECORDED };
    const compiled = TraceCompiler.compile(calls, { params: endpoint.params, examples: params.examples, startUrl: site.startUrl });
    if (!compiled.used) return { success: false, error: BuilderTools.NOTHING_RECORDED, recordedCalls: calls.length, dropped: compiled.dropped };
    const check = TraceCompiler.validate({ ...endpoint, steps: compiled.steps });
    if (!check.ok) {
      return { success: false, error: `compiled steps did not validate: ${check.error}`, steps: compiled.steps, warnings: compiled.warnings, dropped: compiled.dropped, note: 'Fix the steps and store them with set_steps.' };
    }
    try {
      const saved = this._service.updateEndpoint(endpoint.id, this._stepsPatch(endpoint, data, { steps: compiled.steps }));
      return { success: true, steps: saved.steps, returns: saved.returns, warnings: compiled.warnings, dropped: compiled.dropped, recordedCalls: calls.length, note: 'Review the steps: replace leftover literal example values with {{param}} placeholders, add transform steps and waits as needed (set_steps), then test_endpoint.' };
    } catch (err) {
      return { success: false, error: err.message, steps: compiled.steps, warnings: compiled.warnings };
    }
  }

  setSteps(params = {}, ctx = {}) {
    const found = this._endpointFor(params, ctx);
    if (found.error) return { success: false, error: found.error };
    if (!Array.isArray(params.steps)) return { success: false, error: 'steps must be an array of step objects' };
    const patch = { steps: params.steps };
    if (Array.isArray(params.params)) patch.params = params.params;
    if (params.returns && typeof params.returns === 'object') patch.returns = params.returns;
    try {
      const saved = this._service.updateEndpoint(found.endpoint.id, this._stepsPatch(found.endpoint, found.data, patch));
      if (patch.returns) BuilderMeta.patch(this._chatStore(), ctx.conversationId, { returnsDeclared: true });
      return { success: true, endpoint: BuilderTools._endpointView(found.site, saved) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  getEndpoint(params = {}, ctx = {}) {
    const found = this._endpointFor(params, ctx);
    if (found.error) return { success: false, error: found.error };
    return { success: true, endpoint: BuilderTools._endpointView(found.site, found.endpoint, { full: true }) };
  }

  async testEndpoint(params = {}, ctx = {}) {
    const found = this._endpointFor(params, ctx);
    if (found.error) return { success: false, error: found.error };
    let result;
    try {
      result = await this._service.run(found.site.id, found.endpoint.name, params.params || {}, { kind: 'test' });
    } catch (err) {
      return { success: false, ok: false, error: err.message };
    }
    return BuilderTools.testOutcome(result);
  }

  saveEndpoint(params = {}, ctx = {}) {
    const found = this._endpointFor(params, ctx);
    if (found.error) return { success: false, error: found.error };
    try {
      const saved = this._service.updateEndpoint(found.endpoint.id, { status: 'validated' });
      const toolName = ToolNames.endpointTool(found.site, saved);
      return { success: true, toolName, endpoint: BuilderTools._endpointView(found.site, saved), note: `Saved. The endpoint is callable as the chat and MCP tool ${toolName} and as POST /api/site-apis/sites/${found.site.id}/endpoints/${saved.name}/run.` };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  listEndpoints(_params = {}, ctx = {}) {
    const bound = this._bound(ctx);
    if (!bound.site) return { success: false, error: BuilderTools.NOT_BOUND };
    const endpoints = this._service.listEndpoints(bound.site.id).map((e) => BuilderTools._endpointView(bound.site, e));
    return { success: true, site: BuilderTools._siteView(bound.site), endpoints };
  }

  static testOutcome(result) {
    if (!result) return { success: false, ok: false, error: 'the run answered nothing' };
    const out = { success: true, ok: result.success === true };
    if (result.runId) out.runId = result.runId;
    if (result.durationMs != null) out.durationMs = result.durationMs;
    if (result.data !== undefined) BuilderTools._attachData(out, result.data);
    if (result.fault) {
      out.fault = result.fault;
      out.advice = result.advice || Faults.advice(result.fault);
    } else if (!out.ok && result.error) {
      out.error = result.error;
    }
    if (Array.isArray(result.healed) && result.healed.length) out.healed = result.healed;
    if (Array.isArray(result.stepsLog) && result.stepsLog.length) {
      out.stepsLog = result.stepsLog.map((s) => ({ index: s.index, kind: s.kind, ok: s.ok, ms: s.ms, ...(s.via ? { via: s.via } : {}), ...(s.note ? { note: s.note } : {}) }));
    }
    return out;
  }

  static _attachData(out, data) {
    let text;
    try { text = JSON.stringify(data); } catch (_) { text = String(data); }
    if (text === undefined) return;
    if (text.length <= BuilderTools.DATA_CHARS) { out.data = data; return; }
    out.data = text.slice(0, BuilderTools.DATA_CHARS);
    out.dataTruncated = true;
    if (Array.isArray(data)) out.rowCount = data.length;
  }


  _bound(ctx) {
    const conversationId = ctx.conversationId;
    const data = BuilderMeta.read(this._chatStore(), conversationId);
    const site = data.siteId && this._service ? this._service.getSite(data.siteId) : null;
    return { site, data, conversationId };
  }

  _endpointFor(params, ctx) {
    const bound = this._bound(ctx);
    if (!bound.site) return { error: BuilderTools.NOT_BOUND };
    let endpoint = null;
    if (params && params.name) {
      endpoint = this._service.getEndpointByName(bound.site.id, String(params.name));
      if (!endpoint) return { error: `no endpoint named "${params.name}" on site "${bound.site.id}"` };
    } else if (bound.data.endpointId) {
      endpoint = this._service.getEndpoint(bound.data.endpointId);
    }
    if (!endpoint) return { error: BuilderTools.NO_ENDPOINT };
    return { site: bound.site, endpoint, data: bound.data };
  }

  _stepsPatch(endpoint, data, patch) {
    if (patch.returns || (data && data.returnsDeclared)) return patch;
    const description = endpoint.returns && endpoint.returns.description;
    return { ...patch, returns: description ? { description } : {} };
  }

  _chatStore() {
    try { return (this._getChatStore && this._getChatStore()) || null; } catch (_) { return null; }
  }

  _rename(conversationId, site) {
    try {
      const store = this._chatStore();
      if (store && site && typeof store.renameConversation === 'function') store.renameConversation(conversationId, `Site API: ${site.name}`);
    } catch (_) {}
  }

  static _siteView(site) {
    return { id: site.id, name: site.name, origin: site.origin, partition: site.partition, startUrl: site.startUrl, login: site.login, status: site.status };
  }

  static _endpointView(site, endpoint, { full = false } = {}) {
    const view = {
      id: endpoint.id,
      name: endpoint.name,
      description: endpoint.description,
      status: endpoint.status,
      params: endpoint.params,
      returns: endpoint.returns,
      toolName: ToolNames.endpointTool(site, endpoint),
      stepCount: Array.isArray(endpoint.steps) ? endpoint.steps.length : 0,
      lastRun: endpoint.lastRun || null,
    };
    if (full) { view.steps = endpoint.steps; view.policy = endpoint.policy; }
    return view;
  }
}

module.exports = BuilderTools;
