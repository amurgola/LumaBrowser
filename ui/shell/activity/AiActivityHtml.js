import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import DefaultProviderOptions from '../settings/providers/DefaultProviderOptions.js';

export default class AiActivityHtml {
  static render(state) {
    let html = '';
    if (state.runs.size > 0) html += AiActivityHtml._runsGroup(state.runs);
    for (const [modelId, model] of state.models) html += AiActivityHtml._modelGroup(modelId, model);
    return html;
  }

  static modelName(modelId) {
    const [provider, modelName] = modelId.split('::');
    return `${DefaultProviderOptions.TYPE_LABELS[provider] || provider}: ${modelName || '?'}`;
  }

  static elapsed(ms) {
    const secs = Math.floor(ms / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }

  static _runsGroup(runs) {
    let html = '<div class="ai-activity-model-group">';
    html += '<div class="ai-activity-model-header">';
    html += '<span class="ai-activity-model-name">Background runs</span>';
    html += `<span class="ai-activity-concurrency">Running: ${runs.size}</span>`;
    html += '</div>';
    for (const [, run] of runs) html += AiActivityHtml._task('processing', run.title, 'Running...', run.startedAt);
    return html + '</div>';
  }

  static _modelGroup(modelId, model) {
    let html = '<div class="ai-activity-model-group">';
    html += '<div class="ai-activity-model-header">';
    html += `<span class="ai-activity-model-name">${HtmlEscaper.escape(AiActivityHtml.modelName(modelId))}</span>`;
    html += `<span class="ai-activity-concurrency">Active: ${model.activeCount} / Max: ${model.maxConcurrency}</span>`;
    html += '</div>';
    if (model.tasks.size === 0) {
      html += '<div style="color: var(--text-muted); font-size: 11px; padding: 4px 0;">Idle</div>';
    } else {
      for (const [, task] of model.tasks) html += AiActivityHtml._queueTask(task);
    }
    return html + '</div>';
  }

  static _queueTask(task) {
    const processing = task.status === 'processing';
    return AiActivityHtml._task(processing ? 'processing' : 'queued', task.label || task.source,
      processing ? 'Generating...' : 'Waiting...', task.startedAt || task.timestamp);
  }

  static _task(dotClass, source, statusLabel, timestamp) {
    return '<div class="ai-activity-task">'
      + `<span class="ai-activity-status-dot ${dotClass}"></span>`
      + `<span class="ai-activity-task-source">${HtmlEscaper.escape(source)}</span>`
      + `<span class="ai-activity-task-status">${statusLabel}</span>`
      + `<span class="ai-activity-task-timer" data-timestamp="${timestamp}"></span>`
      + '</div>';
  }
}
