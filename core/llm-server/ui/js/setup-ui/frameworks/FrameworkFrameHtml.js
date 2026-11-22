import HtmlEscaper from '../../format/HtmlEscaper.js';
import FoldMemory from '../../setup/FoldMemory.js';
import MoreSettingsChips from '../defaults/MoreSettingsChips.js';
import HostRuntimeAdvice from '../runtimes/HostRuntimeAdvice.js';
import RuntimeRowHtml from '../runtimes/RuntimeRowHtml.js';
import FormatLabels from './FormatLabels.js';
import FrameworkOptionChips from './FrameworkOptionChips.js';
import FrameworkOptionRows from './FrameworkOptionRows.js';

export default class FrameworkFrameHtml {
  static html(group, framework, context) {
    const esc = HtmlEscaper.escape;
    const fw = framework || { id: group.id, name: group.name, formats: [], options: [], activeBuildId: null };
    const optionContext = { ...context, servesDefault: context.currentFrameworkId === group.id };
    return `
                <section class="fw-frame" data-framework="${esc(group.id)}">
                    ${FrameworkFrameHtml.headHtml(group, fw, optionContext.servesDefault)}
                    ${FrameworkFrameHtml._optionsFold(fw, optionContext)}
                    ${FrameworkFrameHtml._buildsFold(group, context.advice)}
                </section>`;
  }

  static headHtml(group, fw, inUse) {
    const esc = HtmlEscaper.escape;
    const loads = FormatLabels.loadsText(fw.formats);
    return `<div class="fw-head">
                        <span class="fw-name">${esc(fw.name || group.name)}</span>
                        ${loads ? `<span class="fw-loads">${esc(loads)}</span>` : ''}
                        ${inUse ? '<span class="fold-chip is-current">In use</span>' : ''}
                        <span class="fw-build">${FrameworkFrameHtml.buildControl(group, fw)}</span>
                    </div>`;
  }

  static buildControl(group, fw) {
    const esc = HtmlEscaper.escape;
    const installed = group.rows.filter((row) => row.installed);
    if (installed.length < 2) return installed.length ? `<span class="fw-build-name">${esc(installed[0].name)}</span>` : '';
    const active = fw.activeBuildId || installed[0].id;
    const options = installed.map((row) => `<option value="${esc(row.id)}" ${row.id === active ? 'selected' : ''}>${esc(row.name)}</option>`).join('');
    return `<select id="fw-${esc(group.id)}-build" class="fw-build-select" data-fw-active-build="${esc(group.id)}" aria-label="${esc(fw.name || group.name)} build">${options}</select>`;
  }

  static _optionsFold(fw, context) {
    const shown = FrameworkOptionRows.shown(fw, context);
    if (!shown.length) return '';
    const key = `llm.fw.${fw.id}.options`;
    return `<details class="setup-fold fw-fold" data-fold-key="${HtmlEscaper.escape(key)}" ${FoldMemory.attr(key)}>
                        <summary><span class="setup-fold-title">Options</span><span class="setup-fold-meta">${MoreSettingsChips.chipsHtml(FrameworkOptionChips.labels(shown))}</span></summary>
                        <div class="setup-fold-body">${FrameworkOptionRows.html(fw, context)}</div>
                    </details>`;
  }

  static _buildsFold(group, advice = {}) {
    const installed = group.rows.filter((row) => row.installed);
    const rest = HostRuntimeAdvice.sortRows(group.rows.filter((row) => !row.installed), advice);
    const key = `llm.fw.${group.id}.builds`;
    const rows = installed.concat(rest).map((row) => RuntimeRowHtml.html(row, advice[row.id] || null)).join('');
    return `<details class="setup-fold fw-fold" data-fold-key="${HtmlEscaper.escape(key)}" ${FoldMemory.attr(key)}>
                        <summary><span class="setup-fold-title">Builds</span><span class="setup-fold-meta"><span class="fold-chip" data-fw-builds-meta>${FrameworkFrameHtml.buildsMeta(installed.length, group.rows.length, false)}</span></span></summary>
                        <div class="setup-fold-body">${rows}</div>
                    </details>`;
  }

  static buildsMeta(installed, total, updateAvailable) {
    return `${installed} of ${total} installed${updateAvailable ? ', update available' : ''}`;
  }
}
