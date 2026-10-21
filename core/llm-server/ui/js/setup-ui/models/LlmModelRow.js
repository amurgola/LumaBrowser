import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import CtxFitMatrix from './CtxFitMatrix.js';

export default class LlmModelRow {
  static ROLE_LABELS = Object.freeze({
    draft: 'draft', embedding: 'embedding', reranker: 'reranker', mmproj: 'projector', mtp: 'MTP head',
  });

  static COMPANION_LABELS = Object.freeze({ mmproj: 'projector', drafter: 'drafter', mtp: 'MTP head' });

  static NO_TEMPLATE_ROLES = new Set(['embedding', 'reranker', 'mmproj', 'mtp']);

  constructor({ recommender, ctxFit, fitBlock }) {
    this._recommender = recommender;
    this._ctxFit = ctxFit;
    this._fitBlock = fitBlock;
  }

  static weightsPath(m) {
    return m.weights && m.weights[0] ? m.weights[0].path : null;
  }

  static nameKey(m) {
    return m.nameKey || m.name || '';
  }

  view(m) {
    const dispName = m.displayName || m.name;
    const nameKey = LlmModelRow.nameKey(m);
    return {
      mlKey: nameKey,
      expanded: false,
      caretEmpty: false,
      name: dispName,
      renameHtml: LlmModelRow._renameHtml(nameKey, dispName),
      tagsHtml: LlmModelRow._headerTags(m),
      sizeText: ByteFormatter.bytes(m.totalBytes),
      actionsHtml: '',
      metaHtml: LlmModelRow._pathHtml(m, dispName, nameKey) + LlmModelRow.factsHtml(m) + LlmModelRow.notesHtml(m) + this._footerHtml(m),
      ctxFitHtml: CtxFitMatrix.html(m, this._ctxFit.forModel(m)),
      fitHtml: this._fitHtml(m),
      quantHtml: '',
      dlHtml: '',
      blurbHtml: '',
      shardsHtml: LlmModelRow._shardsHtml(m),
    };
  }

  static factsHtml(m) {
    const g = m.gguf;
    if (g && g.parsed) {
      const facts = [];
      if (g.blockCount) facts.push(`${g.blockCount} layers`);
      if (g.contextLength) facts.push(`native ctx ${g.contextLength.toLocaleString()}`);
      if (g.fileTypeName) facts.push(HtmlEscaper.escape(g.fileTypeName));
      if (g.hasChatTemplate === false && !LlmModelRow.NO_TEMPLATE_ROLES.has(m.role)) {
        facts.push('<span data-chat-template="absent" title="The GGUF header carries no chat template; the server falls back to its default">no chat template</span>');
      }
      if (!facts.length) return '';
      return `<div class="model-meta">${facts.map((f, i) => `${i ? '<span class="model-meta-sep"></span>' : ''}<span class="model-meta-fact">${f}</span>`).join('')}</div>`;
    }
    if (g && g.parsed === false) {
      return `<div class="model-meta unreadable" title="${HtmlEscaper.escape(g.error || '')}">GGUF header unreadable: runtime split falls back to all-or-nothing</div>`;
    }
    return '';
  }

  static sidecarTags(m) {
    const fmt = ByteFormatter.bytes;
    const esc = HtmlEscaper.escape;
    const sharded = LlmModelRow._isSharded(m);
    const complete = sharded && m.weightsExpectedShards === m.weightsCount;
    return [
      sharded ? `<span class="sidecar-tag ${complete ? '' : 'common'}">${m.weightsCount}/${m.weightsExpectedShards} shards${complete ? '' : ' · incomplete'}</span>` : '',
      (m.mmproj && m.mmproj.length > 0) ? `<span class="sidecar-tag">mmproj · ${fmt(m.mmprojTotalBytes)}</span>` : '',
      (m.mtp && m.mtp.length > 0) ? `<span class="sidecar-tag">MTP head · ${fmt(m.mtpTotalBytes)}</span>` : '',
      (m.kind === 'mmproj-only' || m.kind === 'mtp-only') ? `<span class="sidecar-tag common">${esc(m.kind)}${m.pairing ? '' : ' (no main weights in this dir)'}</span>` : '',
      (m.sidecars || []).map((s) => `<span class="${s.kind === 'common-config' ? 'sidecar-tag common' : 'sidecar-tag'}">${esc(s.name)}</span>`).join(''),
    ].filter(Boolean).join('');
  }

  static _isSharded(m) {
    return m.weightsCount > 1 || (m.weightsExpectedShards && m.weightsExpectedShards > 1);
  }

  static _renameHtml(nameKey, dispName) {
    const esc = HtmlEscaper.escape;
    return '<button class="model-rename" type="button" data-rename-model'
      + ` data-name-key="${esc(nameKey)}" data-cur="${esc(dispName)}"`
      + ' title="Rename for display" aria-label="Rename">&#9998;</button>';
  }

  static _headerTags(m) {
    const arch = (m.gguf && m.gguf.parsed && m.gguf.architecture) ? `<span class="model-arch">${HtmlEscaper.escape(m.gguf.architecture)}</span>` : '';
    const mtp = m.mtpCapable ? '<span class="luma-badge accent" title="Multi-Token Prediction draft branch: see the GPU-fit matrix">MTP</span>' : '';
    return [arch, LlmModelRow.roleBadge(m), mtp].filter(Boolean).join(' ');
  }

  static roleBadge(m) {
    const label = LlmModelRow.ROLE_LABELS[m.role];
    if (!label) return '';
    const esc = HtmlEscaper.escape;
    const byName = m.roleSource === 'filename';
    const reason = m.roleReason ? `${m.roleReason}.` : '';
    const title = byName
      ? `Role taken from the file name, not the GGUF header: the header could not be read or did not say. ${reason}`.trim()
      : reason || 'Role read from the GGUF header.';
    return `<span class="luma-badge${byName ? ' muted' : ''}" data-role="${esc(m.role)}" data-role-source="${esc(m.roleSource || '')}" title="${esc(title)}">${label}</span>`;
  }

  static notesHtml(m) {
    return LlmModelRow.unpairedHtml(m) + LlmModelRow.pairingHtml(m);
  }

  static unpairedHtml(m) {
    const list = Array.isArray(m.unpairedCompanions) ? m.unpairedCompanions : [];
    if (!list.length) return '';
    const esc = HtmlEscaper.escape;
    const files = list.map((c) => `${LlmModelRow.COMPANION_LABELS[c.kind] || 'companion'} <code>${esc(c.name)}</code>`).join(', ');
    const plural = list.length > 1;
    return `<div class="model-note" data-unpaired="${list.length}">Not attached: ${files}. More than one model in this folder could claim ${plural ? 'them' : 'it'}; rename ${plural ? 'a' : 'the'} file after the model it belongs to, or move it into that model's own folder, to attach it.</div>`;
  }

  static pairingHtml(m) {
    const p = m.pairing;
    if (!p || p.status === 'paired' || !p.reason) return '';
    const esc = HtmlEscaper.escape;
    const candidates = Array.isArray(p.candidates) && p.candidates.length ? ` (${p.candidates.map((c) => esc(c)).join(', ')})` : '';
    return `<div class="model-note" data-pairing="${esc(p.status)}">Listed on its own: ${esc(p.reason)}${candidates}.</div>`;
  }

  static _pathHtml(m, dispName, nameKey) {
    const esc = HtmlEscaper.escape;
    const fileLine = dispName !== nameKey ? `<span class="model-path-file">${esc(nameKey)}</span>` : '';
    return `
                <div class="model-path">
                    <span class="model-path-dir">${esc(m.relativeDirectory)}</span>
                    ${fileLine}
                </div>`;
  }

  _footerHtml(m) {
    const tags = LlmModelRow.sidecarTags(m);
    const runtimeTags = this._recommender.tagsHtml(m);
    return (tags || runtimeTags) ? `<div class="model-tags">${tags}${runtimeTags}</div>` : '';
  }

  _fitHtml(m) {
    if (m.kind !== 'weights' || !LlmModelRow.weightsPath(m)) return '';
    return this._fitBlock(LlmModelRow.weightsPath(m));
  }

  static _shardsHtml(m) {
    if (!LlmModelRow._isSharded(m)) return '';
    const fmt = ByteFormatter.bytes;
    const esc = HtmlEscaper.escape;
    return `
                <details class="model-shards"><summary>${m.weightsCount} weight file${m.weightsCount === 1 ? '' : 's'}</summary>
                    <ul>
                        ${m.weights.map((w) => `<li><span class="model-shard-name">${esc(w.name)}</span><span class="model-shard-size">${fmt(w.sizeBytes)}</span></li>`).join('')}
                        ${(m.mmproj || []).map((w) => `<li><span class="model-shard-name">${esc(w.name)}</span><span class="model-shard-size mmproj">${fmt(w.sizeBytes)}</span></li>`).join('')}
                    </ul>
                </details>
            `;
  }
}
