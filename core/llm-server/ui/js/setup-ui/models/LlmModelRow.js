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
      actionsHtml: LlmModelRow.actionsHtml(m),
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
      (m.drafter && m.drafter.length > 0) ? `<span class="sidecar-tag" title="${esc(LlmModelRow._drafterTitle(m))}">${m.drafterChoice === 'file' ? 'drafter (chosen)' : 'drafter'} · ${fmt(m.drafterTotalBytes)}</span>` : '',
      m.drafterChoice === 'off' ? '<span class="sidecar-tag common" title="Switched off in the Drafter dialog; the file stays on disk">drafter off</span>' : '',
      (m.kind === 'mmproj-only' || m.kind === 'mtp-only') ? `<span class="sidecar-tag common">${esc(m.kind)}${m.pairing ? '' : ' (no main weights in this dir)'}</span>` : '',
      (m.sidecars || []).map((s) => `<span class="${s.kind === 'common-config' ? 'sidecar-tag common' : 'sidecar-tag'}">${esc(s.name)}</span>`).join(''),
    ].filter(Boolean).join('');
  }

  static _isSharded(m) {
    return m.weightsCount > 1 || (m.weightsExpectedShards && m.weightsExpectedShards > 1);
  }

  static _drafterTitle(m) {
    return m.drafter.map((d) => `${d.name}${d.blockSize ? ` (block ${d.blockSize})` : ''}`).join(', ')
      + '. Speculative decoding: the drafter proposes a block of tokens per step and the main model verifies it.';
  }

  static _renameHtml(nameKey, dispName) {
    const esc = HtmlEscaper.escape;
    return '<button class="model-rename" type="button" data-rename-model'
      + ` data-name-key="${esc(nameKey)}" data-cur="${esc(dispName)}"`
      + ' title="Rename for display" aria-label="Rename">&#9998;</button>';
  }

  static _headerTags(m) {
    const arch = (m.gguf && m.gguf.parsed && m.gguf.architecture) ? `<span class="model-arch">${HtmlEscaper.escape(m.gguf.architecture)}</span>` : '';
    return [arch, LlmModelRow.roleBadge(m), LlmModelRow.mtpBadge(m)].filter(Boolean).join(' ');
  }

  static speculationOf(m) {
    if (m.speculation) return m.speculation;
    if (m.drafter && m.drafter.length > 0) return 'drafter';
    return m.mtpCapable ? 'mtp' : 'none';
  }

  static mtpBadge(m) {
    if (!m.mtpCapable) return '';
    const spec = LlmModelRow.speculationOf(m);
    if (spec === 'mtp') return '<span class="luma-badge accent" data-mtp="active" title="Multi-Token Prediction draft branch: see the GPU-fit matrix">MTP</span>';
    const why = spec === 'drafter'
      ? 'The weights carry an MTP head, but the drafter file runs instead (a drafter always wins). Pick Built-in MTP head under Drafter to use MTP.'
      : 'The weights carry an MTP head, but speculative decoding is switched off under Drafter.';
    return `<span class="luma-badge muted" data-mtp="unused" title="${HtmlEscaper.escape(why)}">MTP unused</span>`;
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
    return LlmModelRow.unpairedHtml(m) + LlmModelRow.pairingHtml(m) + LlmModelRow.drafterOfferHtml(m) + LlmModelRow.drafterMissingHtml(m);
  }

  static actionsHtml(m) {
    if (!m || m.kind !== 'weights' || m.role !== 'main' || !Array.isArray(m.drafter)) return '';
    return `<button class="luma-btn luma-btn--sm" type="button" data-ml-act="drafter" data-key="${HtmlEscaper.escape(LlmModelRow.nameKey(m))}">Drafter</button>`;
  }

  static drafterMissingHtml(m) {
    if (!m || !m.drafterChoiceMissing) return '';
    const name = String(m.drafterChoiceMissing).replace(/\\/g, '/').split('/').pop();
    return `<div class="model-note" data-drafter-missing>The chosen drafter <code>${HtmlEscaper.escape(name)}</code> is no longer in the models folder; using the automatic pairing. Pick another under Drafter.</div>`;
  }

  static drafterOfferHtml(m) {
    const offer = m.drafterOffer;
    if (!offer || offer.installed || (m.drafter && m.drafter.length > 0)) return '';
    const esc = HtmlEscaper.escape;
    const size = offer.approxBytes ? `, ${ByteFormatter.bytes(offer.approxBytes)}` : '';
    const action = offer.engineSupported
      ? `<button class="luma-btn luma-btn--sm" type="button" data-ml-act="drafter-download" data-key="${esc(LlmModelRow.nameKey(m))}"`
        + ` data-drafter-id="${esc(offer.id)}" data-model-path="${esc(LlmModelRow.weightsPath(m) || '')}"`
        + ` title="${esc(offer.licenseNote || '')}">Download drafter</button>`
      : '<span class="model-drafter-gate">Needs a llama.cpp runtime.</span>';
    return `<div class="model-note model-drafter-offer" data-drafter-offer="${esc(offer.id)}">`
      + `<span class="model-drafter-head">Speculative drafter available: ${esc(offer.label)} for ${esc(offer.target)}</span>`
      + ` (<code>${esc(offer.repo)}</code>${size}). ${esc(offer.blurb || '')} ${action}</div>`;
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
