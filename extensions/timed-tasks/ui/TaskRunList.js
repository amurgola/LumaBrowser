import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import Clipboard from '../../../core/llm-server/ui/js/dom/Clipboard.js';
import TimeText from '../../ui-kit/ui/TimeText.js';
import RunDuration from './RunDuration.js';
import RunLogMarkdown from './RunLogMarkdown.js';

export default class TaskRunList {
  static PAGE_SIZE = 5;

  static PREVIEW_CHARS = 160;

  static COPY_RESET_MS = 1500;

  constructor(invoke) {
    this._invoke = invoke;
    this._pages = new Map();
  }

  resetPage(taskId) {
    this._pages.set(taskId, 0);
  }

  async load(taskId, runsEl) {
    if (!runsEl) return;
    const page = this._pages.get(taskId) ?? 0;
    try {
      const runs = await this._invoke('getTaskRuns', taskId, TaskRunList.PAGE_SIZE + 1, page * TaskRunList.PAGE_SIZE);
      this._render(taskId, runsEl, page, runs);
    } catch (err) {
      runsEl.innerHTML = '<div class="luma-error">Could not load runs.</div>';
    }
  }

  _render(taskId, runsEl, page, runs) {
    const hasNext = runs.length > TaskRunList.PAGE_SIZE;
    const pageRuns = hasNext ? runs.slice(0, TaskRunList.PAGE_SIZE) : runs;
    if (pageRuns.length === 0 && page === 0) {
      runsEl.innerHTML = '<div class="luma-empty luma-empty--plain">No runs yet. Click Run to try it now.</div>';
      return;
    }
    const offset = page * TaskRunList.PAGE_SIZE;
    runsEl.innerHTML = `
          <div class="tt-runs">${pageRuns.map((r) => TaskRunList._runHtml(r)).join('')}</div>
          <div class="tt-runs-pager">
            <button class="luma-btn luma-btn--sm tt-runs-prev" ${page === 0 ? 'disabled' : ''}>Newer</button>
            <span class="tt-runs-range">${offset + 1} to ${offset + pageRuns.length}</span>
            <button class="luma-btn luma-btn--sm tt-runs-next" ${hasNext ? '' : 'disabled'}>Older</button>
          </div>`;
    this._bindRuns(runsEl);
    this._bindPager(taskId, runsEl);
  }

  static _badgeFor(status) {
    if (status === 'completed') return 'ok';
    if (status === 'error') return 'bad';
    return status === 'running' ? 'warn' : 'muted';
  }

  static _runHtml(r) {
    const esc = HtmlEscaper.escape;
    const response = r.response || '';
    const error = r.error || '';
    const hasMore = response.length > TaskRunList.PREVIEW_CHARS;
    const preview = response.substring(0, TaskRunList.PREVIEW_CHARS);
    const displayText = r.status === 'error' && error ? error : preview;
    return `
            <div class="tt-run${hasMore ? ' tt-run--expandable' : ''}" data-run-id="${esc(r.id)}">
              <div class="tt-run-head">
                <span class="luma-badge ${TaskRunList._badgeFor(r.status)}">${esc(r.status)}</span>
                <span class="tt-run-time">${esc(TimeText.formatTime(r.started_at))}</span>
                ${r.completed_at ? `<span class="tt-run-dur">${esc(RunDuration.between(r.started_at, r.completed_at))}</span>` : ''}
                ${r.webhook_sent ? '<span class="luma-badge accent" title="Webhook delivered">webhook</span>' : ''}
                <span class="ext-layout-spacer"></span>
                <button class="luma-btn luma-btn--sm tt-copy-log-btn" data-run-id="${esc(r.id)}" title="Copy the full run log as Markdown">Copy log</button>
              </div>
              <div class="tt-run-preview">${esc(displayText)}${hasMore ? '...' : ''}</div>
              ${hasMore ? `<pre class="tt-run-full ext-hidden">${esc(response)}</pre>` : ''}
            </div>`;
  }

  _bindRuns(runsEl) {
    runsEl.querySelectorAll('.tt-run--expandable').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.tt-copy-log-btn')) return;
        TaskRunList._toggleFull(el);
      });
    });
    runsEl.querySelectorAll('.tt-copy-log-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); this._copyRunLog(btn.dataset.runId, btn); });
    });
  }

  static _toggleFull(el) {
    const full = el.querySelector('.tt-run-full');
    const preview = el.querySelector('.tt-run-preview');
    if (!full || !preview) return;
    const isHidden = full.classList.contains('ext-hidden');
    full.classList.toggle('ext-hidden', !isHidden);
    preview.classList.toggle('ext-hidden', isHidden);
  }

  _bindPager(taskId, runsEl) {
    const prevBtn = runsEl.querySelector('.tt-runs-prev');
    const nextBtn = runsEl.querySelector('.tt-runs-next');
    if (prevBtn) prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cur = this._pages.get(taskId) ?? 0;
      if (cur > 0) { this._pages.set(taskId, cur - 1); this.load(taskId, runsEl); }
    });
    if (nextBtn) nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._pages.set(taskId, (this._pages.get(taskId) ?? 0) + 1);
      this.load(taskId, runsEl);
    });
  }

  async _copyRunLog(runId, btn) {
    const origText = btn.textContent;
    btn.textContent = 'Copying';
    btn.disabled = true;
    const restore = (text) => {
      btn.textContent = text;
      setTimeout(() => { btn.textContent = origText; btn.disabled = false; }, TaskRunList.COPY_RESET_MS);
    };
    try {
      const data = await this._invoke('getRunLog', runId);
      if (!data) return restore('No data');
      await TaskRunList._copy(RunLogMarkdown.format(data));
      restore('Copied');
    } catch (err) {
      console.error('timed-tasks: copy log failed:', err);
      restore('Failed');
    }
  }

  static _copy(text) {
    if (window.electronAPI?.copyToClipboard) return window.electronAPI.copyToClipboard(text);
    return Clipboard.copyText(text);
  }
}
