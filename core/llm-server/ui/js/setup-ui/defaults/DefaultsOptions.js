import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import CtxLadder from '../models/CtxLadder.js';

export default class DefaultsOptions {
  static EFFORT = [
    { id: 'off', label: 'Off', title: 'Answer immediately, no reasoning' },
    { id: 'default', label: 'Auto', title: 'Whatever the model does by default' },
    { id: 'low', label: 'Low', title: 'Shortest reasoning, fastest replies' },
    { id: 'medium', label: 'Medium', title: 'Balanced' },
    { id: 'high', label: 'High', title: 'Longer reasoning' },
    { id: 'xhigh', label: 'Max', title: 'Longest reasoning, for work you walk away from' },
  ];

  static KV = [
    { id: '', label: 'Full (f16)', title: 'Full precision, the runtime default' },
    { id: 'q8_0', label: 'Half (q8_0)', title: 'fp8 cache, about half the KV VRAM' },
  ];

  static PARALLEL_LADDER = [1, 2, 3, 4, 6, 8];

  static APPROVAL = [
    { id: 'auto', label: 'Auto', title: 'Ask in chat, run unattended elsewhere' },
    { id: 'ask', label: 'Always ask', title: 'Ask before risky tools' },
    { id: 'never', label: 'Never ask', title: 'Every enabled tool runs straight away' },
  ];

  static effortPosition(defaults) {
    return defaults.noThink ? 'off' : (defaults.reasoningEffort || 'default');
  }

  static effortLabel(id) {
    return (DefaultsOptions.EFFORT.find((o) => o.id === id) || { label: id }).label;
  }

  static parallelValue(defaults) {
    return Number(defaults.maxConcurrent) >= 1 ? Math.floor(Number(defaults.maxConcurrent)) : 1;
  }

  static parallelOptions(current) {
    const ladder = DefaultsOptions.PARALLEL_LADDER;
    const values = ladder.includes(current) ? ladder : ladder.concat(current).sort((a, b) => a - b);
    return values.map((n) => ({ id: String(n), label: String(n), title: n === 1 ? 'One request at a time' : `${n} requests at once` }));
  }

  static contextOptionsHtml(current) {
    return `<option value="" ${!current ? 'selected' : ''}>Runtime default (4096)</option>`
      + CtxLadder.RUNGS.map((c) => `<option value="${c.tokens}" ${current === c.tokens ? 'selected' : ''}>${c.label} (${c.tokens.toLocaleString()} tokens)</option>`).join('');
  }

  static runtimeOptionsHtml(runtimes, selectedId) {
    const esc = HtmlEscaper.escape;
    if (runtimes.length === 0) return '<option value="">No runtime installed yet</option>';
    return '<option value="">Pick a runtime</option>'
      + runtimes.map((r) => `<option value="${esc(r.id)}" ${r.id === selectedId ? 'selected' : ''}>${esc(r.name)}${r.version ? ' · ' + esc(r.version) : ''}</option>`).join('');
  }

  static modelOptionsHtml(scoped, selectedPath, fitSummary) {
    const esc = HtmlEscaper.escape;
    if (scoped.models.length === 0) {
      return `<option value="">${scoped.bound ? 'No model installed for this runtime yet' : 'No models discovered yet'}</option>`;
    }
    return (scoped.locked ? '' : '<option value="">Pick a model</option>')
      + scoped.models.map((m) => {
        const fit = fitSummary(m.path);
        return `<option value="${esc(m.path)}" ${m.path === selectedPath ? 'selected' : ''}>${esc(m.displayName || m.name)} · ${ByteFormatter.bytes(m.totalBytes)} · ${esc(m.relativeDirectory)}${fit ? ' · ' + fit : ''}</option>`;
      }).join('');
  }
}
