import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import CtxFitMatrix from './CtxFitMatrix.js';

export default class LlmModelRow {
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
      metaHtml: LlmModelRow._pathHtml(m, dispName, nameKey) + LlmModelRow.factsHtml(m) + this._footerHtml(m),
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
      (m.kind === 'mmproj-only' || m.kind === 'mtp-only') ? `<span class="sidecar-tag common">${esc(m.kind)} (no main weights in this dir)</span>` : '',
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
    return [arch, mtp].filter(Boolean).join(' ');
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
