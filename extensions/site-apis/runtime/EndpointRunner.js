const Faults = require('../spec/Faults');
const ParamTemplate = require('../spec/ParamTemplate');
const EndpointSpec = require('../spec/EndpointSpec');
const SiteTab = require('./SiteTab');
const StepExecutor = require('./StepExecutor');
const TargetResolver = require('./TargetResolver');
const FallbackService = require('./FallbackService');
const LoginCheck = require('./LoginCheck');
const LlmTransform = require('./LlmTransform');
const RetryPolicy = require('./RetryPolicy');
const ReturnsCheck = require('./ReturnsCheck');
const RunFault = require('./RunFault');
const RunLog = require('./RunLog');

class EndpointRunner {
  static KINDS = Object.freeze(['call', 'test']);

  constructor({ store, browser = null, chat = null, llm = null, logger = console, onSiteStatus = () => {}, showSiteTab = () => {}, fallbackService = undefined, loginCheck = null, retry = null, sleep = RetryPolicy.sleep }) {
    this._store = store;
    this._browser = browser;
    this._chat = chat;
    this._llm = llm;
    this._logger = logger;
    this._sleep = sleep;
    this._fallback = fallbackService;
    this._loginCheck = loginCheck || new LoginCheck({ browser, onSiteStatus, showSiteTab, logger });
    this._llmTransform = new LlmTransform({ chat, logger });
    this._retry = retry || new RetryPolicy({ sleep });
    this._tabs = new Map();
  }

  async run(site, endpoint, params = {}, { kind = 'call', signal = null } = {}) {
    const started = Date.now();
    const resolved = ParamTemplate.resolve(endpoint.params || [], params);
    if (!resolved.ok) return EndpointRunner._result({ fault: Faults.make(Faults.INVALID_PARAMS, resolved.error), started, runId: null, log: new RunLog() });
    const runKind = EndpointRunner.KINDS.includes(kind) ? kind : 'call';
    const runId = this._store.startRun({ endpointId: endpoint.id, siteId: site.id, kind: runKind, params: resolved.values });
    const log = new RunLog();
    const outcome = await this._execute(site, endpoint, resolved.values, { signal, log });
    const result = EndpointRunner._result({ ...outcome, started, runId, log });
    try {
      this._store.finishRun(runId, { ok: result.success, fault: result.fault || null, result: result.data, stepsLog: result.stepsLog, durationMs: result.durationMs });
    } catch (err) {
      this._logger.warn(`site-apis: could not close run ${runId}: ${err.message}`);
    }
    return result;
  }

  async dispose() {
    const tabs = [...this._tabs.values()];
    this._tabs.clear();
    for (const tab of tabs) await tab.close();
  }

  async _execute(site, endpoint, values, { signal, log }) {
    const policy = EndpointSpec.normalizePolicy(endpoint.policy);
    const steps = (endpoint.steps || []).map((step) => ({ ...step }));
    const tab = this._siteTab(site);
    try {
      const data = await tab.withLock(() => this._retry.execute(policy, {
        signal,
        attempt: (n, deadline) => this._attempt({ site, endpoint, values, steps, policy, tab, log, signal, deadline, attempt: n }),
        onRetry: (n, fault) => { log.nextAttempt(); this._logger.log(`site-apis: ${site.id}/${endpoint.name} attempt ${n} failed (${fault.code}: ${fault.message}); retrying`); },
      }));
      const mismatch = ReturnsCheck.check(endpoint.returns, data);
      if (mismatch) return { fault: mismatch };
      this._loginCheck.markOk(site);
      return { data };
    } catch (err) {
      const fault = RunFault.faultOf(err);
      if (!(err instanceof RunFault)) this._logger.warn(`site-apis: ${site.id}/${endpoint.name} failed unexpectedly: ${err && err.stack ? err.stack : err}`);
      return { fault };
    }
  }

  async _attempt({ site, endpoint, values, steps, policy, tab, log, signal, deadline }) {
    const tabId = await tab.ensure();
    const resolver = new TargetResolver({
      store: this._store, browser: this._browser, service: this._fallbackService(), endpointId: endpoint.id, steps, log,
      allowLlmFallback: policy.allowLlmFallback !== false, logger: this._logger,
    });
    const executor = new StepExecutor({
      browser: this._browser, tab, tabId, site, values, resolver, loginCheck: this._loginCheck,
      llmTransform: this._llmTransform, log, policy, signal, deadline, sleep: this._sleep,
    });
    return executor.runAll(steps);
  }

  _siteTab(site) {
    const key = `${site.partition}|${site.id}`;
    if (!this._tabs.has(key)) this._tabs.set(key, new SiteTab({ browser: this._browser, site, logger: this._logger }));
    return this._tabs.get(key);
  }

  _fallbackService() {
    if (this._fallback !== undefined) return this._fallback;
    try {
      this._fallback = FallbackService.build({ llm: this._llm, chat: this._chat, browser: this._browser });
    } catch (err) {
      this._logger.warn(`site-apis: selector recovery is unavailable: ${err.message}`);
      this._fallback = null;
    }
    return this._fallback;
  }

  static _result({ data = null, fault = null, started, runId, log }) {
    const out = { success: !fault, data: fault ? null : data, runId, durationMs: Date.now() - started, healed: log.healed.map((h) => ({ ...h })), stepsLog: log.toJSON() };
    if (fault) {
      out.fault = fault;
      out.advice = Faults.advice(fault);
    }
    return out;
  }
}

module.exports = EndpointRunner;
