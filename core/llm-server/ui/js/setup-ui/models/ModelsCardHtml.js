import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import FoldMemory from '../../setup/FoldMemory.js';

export default class ModelsCardHtml {
  static scaffold() {
    return '<div data-ml-chrome="top"></div>'
      + `<details class="setup-fold" data-fold-key="llm.installedModels" data-ml-fold="installed" ${FoldMemory.attr('llm.installedModels')}>`
      + '<summary><span class="setup-fold-title">Installed models</span><span class="setup-fold-meta" data-ml-chrome="installed-meta"></span></summary>'
      + '<div class="setup-fold-body">'
      + '<div data-ml-chrome="list-note"></div>'
      + '<div class="model-row-list" data-ml-mount="llm"></div>'
      + '<div data-ml-chrome="bottom"></div>'
      + '</div>'
      + '</details>'
      + `<details class="setup-fold" data-fold-key="llm.addonModels" data-ml-fold="addon" ${FoldMemory.attr('llm.addonModels')} hidden>`
      + '<summary><span class="setup-fold-title">Add-on models</span><span class="setup-fold-meta" data-ml-chrome="addon-meta"></span></summary>'
      + '<div class="setup-fold-body">'
      + '<div data-ml-chrome="addon-top"></div>'
      + '<div class="model-row-list" data-ml-mount="llm-addon"></div>'
      + '</div>'
      + '</details>';
  }

  static controls(config) {
    const esc = HtmlEscaper.escape;
    const isDefault = !!config.isUsingDefault;
    return `
                <div class="models-controls">
                    <input type="text" class="models-path-input ${isDefault ? 'is-default' : ''}" id="modelsPathInput" value="${esc(config.effectivePath || '')}" placeholder="${esc(config.defaultPath)}"
                        title="${isDefault ? 'Default location. Type or browse to point at an existing model library.' : 'Custom path. Default is ' + esc(config.defaultPath)}">
                    <button class="luma-btn luma-btn--sm" data-pick-dir>Browse…</button>
                    ${isDefault ? '' : '<button class="luma-btn luma-btn--sm" data-reset-dir>Use default</button>'}
                    <span class="path-hint-status" data-models-status></span>
                </div>
            `;
  }

  static listNote(scan) {
    const esc = HtmlEscaper.escape;
    if (!(scan && scan.available)) {
      return `
                    <div class="luma-empty">
                        <div>${esc((scan && scan.reason) || 'Models directory unavailable.')}</div>
                        ${scan && scan.missing ? '<div style="margin-top:6px;font-size:11.5px;color:var(--text-muted);">Create the folder and drop .gguf files into it, then click Refresh.</div>' : ''}
                    </div>`;
    }
    if ((scan.models || []).length === 0) return `<div class="luma-empty">No .gguf files found under <code>${esc(scan.dir)}</code>.</div>`;
    return '';
  }

  static bottom(scan) {
    const truncated = scan && scan.available && scan.truncated
      ? '<div class="models-default-note" style="margin-top:8px;">Scan truncated at the walk cap: point at a tighter directory to see everything.</div>'
      : '';
    return truncated + ModelsCardHtml.sourceCallout();
  }

  static pillText(scan) {
    if (scan && scan.available) {
      const n = (scan.models || []).length;
      return `${n} ${n === 1 ? 'model' : 'models'}`;
    }
    return scan && scan.reason ? 'unavailable' : 'n/a';
  }

  static installedMeta(total, current) {
    return `<span class="fold-chip">${total}</span>`
      + (current
        ? `<span class="fold-chip is-current" title="The default model, set in the Defaults card">In use: ${HtmlEscaper.escape(current.displayName || current.name)} · ${ByteFormatter.bytes(current.totalBytes)}</span>`
        : '');
  }

  static sourceCallout() {
    return `
                <details class="source-callout">
                    <summary>Where models come from</summary>
                    Easy Setup downloads curated
                    <code>.gguf</code> weights directly from <strong>Hugging Face</strong> public
                    repositories (e.g. <code>bartowski</code>) using each file's official
                    <code>/resolve/</code> download URL: no account or token, and no
                    third-party mirror.
                    <ul>
                        <li>Downloads are <strong>resumable</strong> (a <code>.partial</code> file
                            is kept and continued on retry) and land in the models directory above.</li>
                        <li>The <em>Advanced</em> option in Easy Setup accepts any specific
                            Hugging Face <code>.gguf</code> URL or <code>owner/repo/file.gguf</code>.</li>
                        <li>Nothing leaves your machine: these are plain HTTPS GETs to
                            <button class="src-link" data-runtime-action="open-external"
                                data-runtime-url="https://huggingface.co">huggingface.co ↗</button>.</li>
                    </ul>
                </details>
            `;
  }
}
