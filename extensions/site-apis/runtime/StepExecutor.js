const StepKinds = require('../spec/StepKinds');
const ParamTemplate = require('../spec/ParamTemplate');
const Faults = require('../spec/Faults');
const InterstitialWait = require('../../../core/llm-server/agent/InterstitialWait');
const RetryPolicy = require('./RetryPolicy');
const RunFault = require('./RunFault');
const RunLog = require('./RunLog');
const StepReaders = require('./StepReaders');
const Transforms = require('./Transforms');

class StepExecutor {
  static SWALLOWED_WHEN_OPTIONAL = new Set([Faults.STEP_FAILED, Faults.TIMEOUT]);
  static TEXT_WAIT_SELECTOR = 'body';
  static DEFAULT_SCROLL_TIMES = 1;
  static DEFAULT_RECOVERY_TIMEOUT_MS = 45000;

  constructor({ browser, tab, tabId, site, values, resolver, loginCheck, llmTransform, log, policy, signal = null, deadline = Infinity, sleep = RetryPolicy.sleep }) {
    this._browser = browser;
    this._tab = tab;
    this._tabId = tabId;
    this._site = site;
    this._values = values;
    this._resolver = resolver;
    this._loginCheck = loginCheck;
    this._llmTransform = llmTransform;
    this._log = log;
    this._policy = policy;
    this._signal = signal;
    this._deadline = deadline;
    this._sleep = sleep;
    this._interstitial = new InterstitialWait({ browserService: browser, sleep });
    this._readers = new StepReaders({ browser, tabId, targeted: (step, index, action, primary) => this._targeted(step, index, action, primary) });
    this._result = undefined;
    this._wanted = null;
  }

  async runAll(steps) {
    for (let index = 0; index < steps.length; index += 1) await this._runStep(steps[index], index);
    return this._result === undefined ? null : this._result;
  }

  async _runStep(raw, index) {
    RetryPolicy.throwIfAborted(this._signal);
    if (Date.now() > this._deadline) throw RunFault.make(Faults.TIMEOUT, 'The run exceeded its total timeout', { step: index });
    const step = StepExecutor.render(raw, this._values);
    const entry = this._log.begin(index, step.kind);
    const wanted = { value: true };
    this._wanted = wanted;
    try {
      const out = await RetryPolicy.bounded(this._dispatch(step, index), { timeoutMs: this._budgetOf(step), signal: this._signal, step: index, timeoutMessage: `Step ${index + 1} (${step.kind}) timed out` });
      entry.end(true, { via: out.via || RunLog.VIA_PAGE, note: out.note, recoveryMs: out.recoveryMs });
      if (step.kind === 'navigate' || out.urlChanged) await this._afterNavigation(index);
    } catch (err) {
      wanted.value = false;
      const fault = RunFault.faultOf(err, index);
      entry.end(false, { note: fault.message });
      if (step.optional && StepExecutor.SWALLOWED_WHEN_OPTIONAL.has(fault.code)) return;
      throw new RunFault(fault);
    }
  }

  static render(step, values) {
    const rendered = ParamTemplate.render(step, values, { encode: false });
    if (step.kind === 'navigate') rendered.url = ParamTemplate.render(step.url, values, { encode: true });
    return rendered;
  }

  _dispatch(step, index) {
    const handler = this[`_${step.kind}`];
    if (typeof handler !== 'function' || !StepKinds.KINDS.includes(step.kind)) throw RunFault.step(index, `Unknown step kind "${step.kind}"`);
    return handler.call(this, step, index);
  }

  async _navigate(step, index) {
    const reply = await this._browser.navigate(this._tabId, step.url);
    this._tab.noteReply(reply);
    const data = (reply && reply.data) || {};
    if (!reply || !reply.success || data.loaded === false || data.error) {
      throw RunFault.make(Faults.SITE_UNAVAILABLE, `Could not load ${step.url}: ${(reply && reply.error) || data.error || 'the page did not load'}`, { step: index });
    }
    await this._browser.waitForLoad(this._tabId, this._timeoutOf(step));
    if (Number(step.waitMs) > 0) await this._sleep(Number(step.waitMs));
    await this._settle({});
    return { via: RunLog.VIA_PAGE };
  }

  async _click(step, index) {
    return this._targetedAction(step, index, 'click', (selector) => this._browser.click(this._tabId, { selector, text: step.text || undefined }));
  }

  async _type(step, index) {
    return this._targetedAction(step, index, 'type', (selector) => this._browser.typeInto(this._tabId, {
      selector, text: String(step.text), submit: !!step.submit, clear: step.clear !== false,
    }));
  }

  async _press_key(step, index) {
    if (!step.selector && !step.description) return this._pageAction(this._browser.pressKey(this._tabId, { key: step.key }));
    return this._targetedAction(step, index, 'press_key', (selector) => this._browser.pressKey(this._tabId, { selector, key: step.key }));
  }

  async _select(step, index) {
    return this._targetedAction(step, index, 'select', (selector) => this._browser.selectOption(this._tabId, { selector, option: step.option }));
  }

  async _scroll(step, index) {
    const times = Math.max(1, Number(step.times) || StepExecutor.DEFAULT_SCROLL_TIMES);
    let last = { via: RunLog.VIA_PAGE };
    for (let n = 0; n < times; n += 1) {
      last = step.selector || step.description
        ? await this._targetedAction(step, index, 'scroll', (selector) => this._browser.scroll(this._tabId, { selector }))
        : await this._pageAction(this._browser.scroll(this._tabId, { direction: step.direction || 'down', amount: step.amount || undefined }));
    }
    return last;
  }

  async _wait(step, index) {
    const options = { text: step.text || undefined, state: step.state || 'visible', timeout: this._timeoutOf(step) };
    if (!step.selector && !step.description) {
      if (!step.text) throw RunFault.step(index, 'wait needs a selector, a description or text');
      return this._pageAction(this._browser.waitFor(this._tabId, { ...options, selector: StepExecutor.TEXT_WAIT_SELECTOR }));
    }
    return this._targetedAction(step, index, 'find', (selector) => this._browser.waitFor(this._tabId, { ...options, selector }));
  }

  async _settle(step) {
    const manager = this._browser.getTabManager ? this._browser.getTabManager() : null;
    if (!manager || typeof manager.waitForSettle !== 'function') return { via: RunLog.VIA_PAGE };
    const reply = await manager.waitForSettle(this._tabId, { quietMs: step.quietMs, maxMs: step.maxMs });
    this._tab.noteReply(reply);
    return { via: RunLog.VIA_PAGE };
  }

  async _read(step, index) {
    const { value, via, recoveryMs } = await this._readers.read(step, index);
    this._result = StepReaders.merge(this._result, step.as, value);
    return { via, recoveryMs };
  }

  async _extract(step, index) {
    const { rows, via, note, recoveryMs } = await this._readers.extract(step, index);
    this._result = StepReaders.merge(this._result, step.as, rows);
    return { via, note, recoveryMs };
  }

  async _table(step, index) {
    const { rows, via, recoveryMs } = await this._readers.table(step, index);
    this._result = StepReaders.merge(this._result, step.as, rows);
    return { via, recoveryMs };
  }

  async _transform(step, index) {
    try {
      this._result = Transforms.apply(step, this._result === undefined ? null : this._result);
    } catch (err) {
      throw RunFault.step(index, err.message);
    }
    return { via: RunLog.VIA_LOCAL };
  }

  async _llm_transform(step, index) {
    try {
      this._result = await this._llmTransform.apply(step, this._result === undefined ? null : this._result, { timeoutMs: this._timeoutOf(step) });
    } catch (err) {
      throw RunFault.step(index, err.message);
    }
    return { via: RunLog.VIA_LLM };
  }

  async _targeted(step, index, action, primary) {
    const wanted = this._wanted;
    const resolved = await this._resolver.resolve({
      tabId: this._tabId,
      index,
      step,
      action,
      primary: async (selector) => {
        const reply = await primary(selector);
        this._tab.noteReply(reply);
        return reply;
      },
      stillWanted: () => !!(wanted && wanted.value) && !(this._signal && this._signal.aborted),
    });
    if (!resolved.ok) throw RunFault.step(index, `${step.kind}: ${resolved.error}`, resolved.result && resolved.result.zeroRows ? { zeroRows: true } : null);
    return { result: resolved.result, via: resolved.via, recoveryMs: resolved.recoveryMs };
  }

  async _targetedAction(step, index, action, primary) {
    const { result, via, recoveryMs } = await this._targeted(step, index, action, primary);
    return { via, urlChanged: !!(result && result.urlChanged), recoveryMs };
  }

  async _pageAction(promise) {
    const reply = await promise;
    this._tab.noteReply(reply);
    if (!reply || !reply.success) throw new Error((reply && reply.error) || 'the action failed');
    return { via: RunLog.VIA_PAGE, urlChanged: !!reply.urlChanged };
  }

  async _afterNavigation(index) {
    const waited = await this._interstitial.settle(this._tabId);
    if (waited && !waited.moved) throw RunFault.make(Faults.INTERSTITIAL, `The page at ${waited.from} says it will continue by itself but did not`, { step: index });
    try {
      await this._loginCheck.check(this._site, this._tabId);
    } catch (err) {
      if (err instanceof RunFault && err.fault.step == null) err.fault.step = index;
      throw err;
    }
  }

  _timeoutOf(step) {
    const own = Number(step.timeoutMs);
    return own > 0 ? own : Number(this._policy.stepTimeoutMs) || 15000;
  }

  _budgetOf(step) {
    const base = this._timeoutOf(step);
    const mayRecover = StepKinds.mayTarget(step.kind) && !!step.description && this._policy.allowLlmFallback !== false;
    return mayRecover ? base + StepExecutor.recoveryTimeoutMs(this._policy) : base;
  }

  static recoveryTimeoutMs(policy) {
    const n = Number(policy && policy.recoveryTimeoutMs);
    return Number.isFinite(n) ? Math.max(0, n) : StepExecutor.DEFAULT_RECOVERY_TIMEOUT_MS;
  }
}

module.exports = StepExecutor;
