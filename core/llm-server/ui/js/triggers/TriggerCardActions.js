import Clipboard from '../dom/Clipboard.js';
import TriggerCardButtons from './TriggerCardButtons.js';

export default class TriggerCardActions {
  static RUN_ACTS = ['pickfile', 'latest', 'send', 'test', 'arm', 'pause'];

  constructor(card, { openRuns }) {
    this._card = card;
    this._openRuns = openRuns;
  }

  async handle(e) {
    const button = e.target.closest('[data-act]');
    const state = this._card.state;
    if (!button || !state.trigger || !state.api) return;
    const act = button.dataset.act;
    if (this._handleLocal(act)) return;
    if (act === 'runs') { this._openRuns(state.trigger.id); return; }
    if (act === 'copy') return this._copy(button);
    if (act === 'adopt' || act === 'restore' || act === 'approve' || act === 'secret-save') return this._busyCall(act, button);
    if (TriggerCardActions.RUN_ACTS.includes(act)) return this._run(act);
  }

  _handleLocal(act) {
    const state = this._card.state;
    if (act === 'compose') { state.composerOpen = true; this._paintAndFocus('.cm-trig-ta'); return true; }
    if (act === 'cancel') { state.composerOpen = false; this._card.paint(); return true; }
    if (act === 'secret-open') { state.secretOpen = true; this._paintAndFocus('.cm-trig-secret'); return true; }
    if (act === 'secret-cancel') { state.secretOpen = false; this._card.paint(); return true; }
    return false;
  }

  _paintAndFocus(selector) {
    this._card.paint();
    const field = this._card.element && this._card.element.querySelector(selector);
    if (field) field.focus();
  }

  async _copy(button) {
    const ok = await Clipboard.copyText(button.dataset.url || '');
    this._card.setNote(ok ? 'URL copied' : 'Could not copy', ok ? 'ok' : 'error');
    this._card.paint();
  }

  async _busyCall(act, button) {
    const state = this._card.state;
    const api = state.api;
    const id = state.trigger.id;
    if (act === 'secret-save' && !this._secretValue().trim()) { this._card.setNote('Nothing entered', 'error'); this._card.paint(); return; }
    if (act === 'approve' && !(state.pending && state.pending.approval)) return;
    state.busy = true;
    try {
      await this[TriggerCardActions._busyMethod(act)](api, id, button);
    } catch (err) {
      this._card.setNote((err && err.message) || TriggerCardActions._busyFailure(act), 'error');
    } finally {
      state.busy = false;
      await this._card.refresh();
    }
  }

  static _busyMethod(act) {
    return { adopt: '_adopt', restore: '_restore', approve: '_approve', 'secret-save': '_saveSecret' }[act];
  }

  static _busyFailure(act) {
    return { adopt: 'Could not adopt', restore: 'Could not restore', approve: 'Could not answer', 'secret-save': 'Could not save' }[act];
  }

  async _adopt(api, id) {
    const r = await api.triggers.adoptLatestEvent(id);
    this._result(r, 'Latest event is now the sample; test again if the prompt changed', 'Could not adopt');
  }

  async _restore(api, id, button) {
    const r = await api.triggers.rollback(id, parseInt(button.dataset.version, 10));
    this._result(r, r && r.success ? 'Restored v' + r.restored + (r.restoredTest ? '; its test still counts' : '; test it again') : '', 'Could not restore');
  }

  async _approve(api, _id, button) {
    const decision = button.dataset.decision;
    const r = await api.triggers.approve(this._card.state.pending.approval.runId, decision);
    this._result(r, decision === 'deny' ? 'Denied; the run continues without it' : 'Allowed; the run continues', 'Could not answer');
  }

  async _saveSecret(api, id) {
    const r = await api.triggers.setSecret(id, this._secretValue().trim());
    this._card.state.secretOpen = false;
    this._result(r, r && r.success ? 'Secret saved' + (r.encrypted ? ' (encrypted)' : '') : '', 'Could not save');
  }

  _secretValue() {
    const input = this._card.element && this._card.element.querySelector('.cm-trig-secret');
    return input ? input.value : '';
  }

  _result(r, okText, failText) {
    if (r && r.success) this._card.setNote(okText, 'ok');
    else this._card.setNote((r && r.error) || failText, 'error');
  }

  async _run(act) {
    const state = this._card.state;
    if (state.busy) return;
    state.busy = true;
    try {
      const res = await this._runAct(act, state.api, state.trigger.id);
      if (res && res.success === false) this._card.setNote(res.error || 'That did not work', 'error');
    } catch (err) {
      this._card.setNote((err && err.message) || 'That did not work', 'error');
    } finally {
      state.busy = false;
      state.running = false;
      await this._card.refresh();
    }
  }

  async _runAct(act, api, id) {
    if (act === 'pickfile' || act === 'latest') return this._simulateSource(act, api, id);
    if (act === 'send') return this._sendComposed(api, id);
    if (act === 'test') return this._test(api, id);
    const enabled = act === 'arm';
    const res = await api.triggers.update(id, { enabled });
    if (res && res.success) {
      if (enabled) this._card.setNote('Armed. Real deliveries run from now on.', 'ok');
      else this._card.setNote('Paused. Deliveries get a 503 until re-armed.', '');
    }
    return res;
  }

  async _simulateSource(act, api, id) {
    let body = null;
    if (act === 'pickfile') {
      const picked = await api.triggers.pickFile(id);
      if (!picked || !picked.success || picked.canceled || !picked.path) return null;
      body = { path: picked.path };
    }
    this._markRunning();
    const res = await api.triggers.simulate(id, body);
    if (res && res.success) this._simulatedNote(res);
    return res;
  }

  async _sendComposed(api, id) {
    const state = this._card.state;
    const textarea = this._card.element && this._card.element.querySelector('.cm-trig-ta');
    const text = (textarea && textarea.value.trim()) || TriggerCardButtons.DEFAULT_SAMPLE;
    state.composeText = text;
    this._markRunning();
    const res = await api.triggers.simulate(id, text);
    if (res && res.success) {
      state.composerOpen = false;
      this._simulatedNote(res);
    }
    return res;
  }

  async _test(api, id) {
    this._card.state.running = true;
    this._card.paint();
    const res = await api.triggers.test(id);
    if (res && res.success) {
      const ok = res.run && res.run.status === 'ok';
      this._card.setNote(ok ? 'Test passed. Arm it when ready.' : 'Test failed', ok ? 'ok' : 'error');
    }
    return res;
  }

  _markRunning() {
    const state = this._card.state;
    state.running = state.trigger.status !== 'awaiting_sample';
    this._card.paint();
  }

  _simulatedNote(res) {
    const ran = res.run && res.run.status === 'ok';
    this._card.setNote(res.captured ? 'Sample captured. Test it when ready.' : (ran ? 'Run finished' : 'Run failed'), res.captured || ran ? 'ok' : 'error');
  }
}
