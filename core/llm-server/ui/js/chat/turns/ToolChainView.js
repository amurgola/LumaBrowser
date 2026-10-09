import ChatIcons from '../ChatIcons.js';
import ToolCardText from './ToolCardText.js';
import ToolLabels from './ToolLabels.js';
import TurnData from './TurnData.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ToolChainView {
  static DETAIL_MAX = 120;

  static REASON_MAX = 200;

  constructor(ctx) {
    this._ctx = ctx;
  }

  create(m) {
    const tools = TurnData.tools(m);
    if (!tools.length) return null;
    const streaming = m === this._ctx.state.streamMsg;
    const running = streaming || tools.some((x) => x.status === 'run');
    if (running) m._chainOpen = true;
    else if (!m._chainUserToggled) m._chainOpen = false;
    const wrap = Dom.el('div', 'cm-chain' + (m._chainOpen ? ' open' : '') + (running ? ' running' : ''));
    wrap.appendChild(this._head(m, tools, running, wrap));
    wrap.appendChild(this._body(m, tools, streaming, running));
    return wrap;
  }

  signature(m) {
    const tools = TurnData.tools(m);
    const running = (m === this._ctx.state.streamMsg) || tools.some((x) => x.status === 'run');
    const pv = m._preview ? (m._preview.live ? 'L' : 'F') : '';
    return (running ? 'R' : 'S') + '|' + pv + '|' + tools.map((t) => (t.tool || '') + ':' + (t.status || '')).join(',');
  }

  updatePendingDetail(chain, m) {
    if (!chain) return;
    const tools = TurnData.tools(m);
    const i = tools.findIndex((x) => x._pending);
    if (i === -1) return;
    const card = chain.querySelectorAll('.cm-toolcard')[i];
    const det = card && card.querySelector('.cm-tc-det');
    if (!det) return;
    const text = String(ToolCardText.detail(tools[i])).slice(0, ToolChainView.DETAIL_MAX);
    if (det.textContent !== text) det.textContent = text;
  }

  _head(m, tools, running, wrap) {
    const errs = tools.filter((x) => x.status === 'err').length;
    const active = running ? [...tools].reverse().find((x) => x.status === 'run') : null;
    const label = running
      ? (active ? ToolLabels.stepLabel(active) : 'Working…')
      : 'Ran ' + tools.length + ' step' + (tools.length === 1 ? '' : 's') + (errs ? ' · ' + errs + ' failed' : '');
    const icon = running ? '<span class="cm-tc-spin"></span>' : errs ? '<span class="cm-chain-bang">!</span>' : ChatIcons.check;
    const head = Dom.el('button', 'cm-chain-head',
      '<span class="cm-chain-ic">' + icon + '</span><span class="cm-chain-label">' + HtmlEscaper.escape(label) + '</span>'
      + '<span class="cm-chain-caret">' + ChatIcons.chevron + '</span>');
    head.addEventListener('click', () => {
      m._chainOpen = !m._chainOpen;
      m._chainUserToggled = true;
      wrap.classList.toggle('open', m._chainOpen);
    });
    return head;
  }

  _body(m, tools, streaming, running) {
    const body = Dom.el('div', 'cm-chain-body');
    const steps = Dom.el('div', 'cm-chain-steps');
    body.appendChild(steps);
    for (const tc of tools) steps.appendChild(this._stepCard(tc));
    const preview = this._previewCard(m, streaming);
    if (preview) body.appendChild(preview);
    if (running) requestAnimationFrame(() => { try { steps.scrollTop = steps.scrollHeight; } catch (_) {} });
    return body;
  }

  _stepCard(tc) {
    const st = tc.status === 'ok' ? 'ok' : tc.status === 'err' ? 'err' : 'run';
    if (tc._approval && st === 'run') return this._approvalCard(tc);
    if (tc.tool === 'ask_user_takeover' && st === 'run') return this._takeoverCard(tc);
    return this._plainCard(tc, st);
  }

  _approvalCard(tc) {
    const detail = String(tc._approval.detail || ToolLabels.labelOf(tc.tool)).slice(0, ToolChainView.REASON_MAX);
    return this._waitCard('Approve this?', detail, 'approval', [
      ['once', 'Allow once', true], ['run', 'Allow for this run', false], ['reject', 'Decline', false],
    ], (answer) => this._ctx.api.approvalRespond(answer));
  }

  _takeoverCard(tc) {
    const reason = (tc.params && tc.params.reason) ? String(tc.params.reason) : 'The page needs you (a login or verification step).';
    return this._waitCard('Needs you', reason.slice(0, ToolChainView.REASON_MAX), 'takeover', [
      ['continue', 'I did it, continue', true], ['skip', 'Skip this step', false],
    ], (answer) => this._ctx.api.takeoverRespond(answer));
  }

  _waitCard(title, detail, attr, buttons, respond) {
    const card = Dom.el('div', 'cm-toolcard run cm-takeover');
    card.innerHTML = '<span class="cm-tc-node"></span>'
      + '<span class="cm-tc-ic"><span class="cm-tc-spin"></span></span>'
      + '<span class="cm-tc-main"><b>' + title + '</b>'
      + '<span class="cm-tc-det">' + HtmlEscaper.escape(detail) + '</span>'
      + '<span class="cm-takeover-actions">'
      + buttons.map(([value, label, primary]) => '<button type="button" class="cm-takeover-btn' + (primary ? ' primary' : '')
        + '" data-' + attr + '="' + value + '">' + label + '</button>').join('')
      + '</span></span>';
    const all = card.querySelectorAll('[data-' + attr + ']');
    all.forEach((btn) => btn.addEventListener('click', async () => {
      all.forEach((b) => { b.disabled = true; });
      try { await respond(btn.dataset[attr]); } catch (_) {}
    }));
    return card;
  }

  _plainCard(tc, st) {
    const card = Dom.el('div', 'cm-toolcard ' + st);
    const det = HtmlEscaper.escape(String(ToolCardText.detail(tc)).slice(0, ToolChainView.DETAIL_MAX));
    card.innerHTML = '<span class="cm-tc-node"></span>'
      + '<span class="cm-tc-ic">' + ToolChainView._icon(tc.tool) + '</span>'
      + '<span class="cm-tc-main"><b>' + HtmlEscaper.escape(tc._pending ? ToolLabels.stepLabel(tc) : ToolLabels.labelOf(tc.tool)) + '</b>'
      + (det || tc._pending ? '<span class="cm-tc-det">' + det + '</span>' : '') + '</span>'
      + '<span class="cm-tc-st">' + (st === 'ok' ? ChatIcons.check : st === 'err' ? '!' : '<span class="cm-tc-spin"></span>') + '</span>';
    this._addViewFile(card, tc, st);
    return card;
  }

  static _icon(tool) {
    if (tool === 'generate_image' || tool === 'edit_image') return ChatIcons.image;
    if (tool === 'create_artifact' || tool === 'edit_artifact' || tool === 'create_live_artifact') return ChatIcons.doc;
    return ChatIcons.tools;
  }

  _addViewFile(card, tc, st) {
    const viewPath = this._viewPath(tc, st);
    if (!viewPath) return;
    card.classList.add('cm-tc-view');
    card.title = 'View ' + viewPath;
    card.addEventListener('click', () => { this._ctx.panel.openWorkspaceFile(viewPath); });
  }

  _viewPath(tc, st) {
    if (st === 'run') return null;
    const api = this._ctx.api;
    const vm = api.chat && api.chat.readWorkspaceFile ? ToolCardText.meta(tc) : null;
    if (vm && vm.path) return vm.path;
    if (vm || !this._ctx.codeEditorDocked()) return null;
    const isFileTool = /^(read|write|edit)_file$/.test(tc.tool || '');
    return isFileTool && tc.params && typeof tc.params.path === 'string' ? tc.params.path : null;
  }

  _previewCard(m, streaming) {
    if (!m._preview) return null;
    const api = this._ctx.api;
    const live = !!m._preview.live && streaming && !!(api && api.tabPreview);
    if (!live && m._preview.live) return null;
    return this._ctx.tabPreview.create(m._preview, live);
  }
}
