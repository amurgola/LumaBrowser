import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class PlanExplainerHtml {
  static PILLS = {
    ready: ['ok', 'running'],
    starting: ['warn', 'starting'],
    stopping: ['warn', 'stopping'],
    error: ['bad', 'failed'],
    idle: ['accent', 'stopped'],
  };

  static pill(state) {
    return PlanExplainerHtml.PILLS[state] || ['accent', state];
  }

  static html(status, opts) {
    const esc = HtmlEscaper.escape;
    const plan = status.plan;
    const notes = plan.notes;
    const decision = PlanExplainerHtml.decision(notes);
    return `
                <div class="plan-headline">${PlanExplainerHtml.headline(plan)}</div>
                ${decision ? `<div class="plan-decision">${esc(decision)}</div>` : ''}
                ${PlanExplainerHtml.errorBlock(status, opts.startError)}
                <details class="plan-notes-details"${opts.notesOpen ? ' open' : ''}>
                    <summary>Why these choices</summary>
                    <ul class="plan-notes">${notes.map((n) => `<li>${esc(String(n))}</li>`).join('')}</ul>
                </details>
                <details class="plan-log-details"${opts.logOpen ? ' open' : ''}>
                    <summary>Server log</summary>
                    <pre class="plan-log" id="planLogPre">${PlanExplainerHtml.logHtml(status.logs)}</pre>
                </details>
                ${PlanExplainerHtml.actionRow(status.state)}
            `;
  }

  static headline(plan) {
    return [plan.modelName, plan.runtimeName].filter(Boolean).map(HtmlEscaper.escape).join(' · ')
      + (plan.port ? ` · port ${Number(plan.port)}` : '');
  }

  static decision(notes) {
    const found = notes.find((n) => String(n).startsWith('Decision:'));
    return found ? String(found).replace(/^Decision:\s*/, '') : null;
  }

  static errorBlock(status, startError) {
    const esc = HtmlEscaper.escape;
    if (status.state === 'error') {
      const info = status.lastErrorInfo;
      const fallback = String(status.lastError || '').split('\n')[0];
      return PlanExplainerHtml._error(esc(info ? info.title : 'The server failed'), esc(info ? info.advice : (fallback || 'See the server log below.')));
    }
    if (startError) return PlanExplainerHtml._error('Could not start', esc(startError));
    return '';
  }

  static logHtml(logs) {
    return (Array.isArray(logs) ? logs : [])
      .map((e) => `<span class="${e.stream === 'stderr' ? 'plan-log-err' : ''}">${HtmlEscaper.escape(e.line)}</span>`).join('\n');
  }

  static actionRow(state) {
    const busy = state === 'starting' || state === 'stopping';
    const running = state === 'ready' || state === 'starting';
    const button = running
      ? '<button class="luma-btn luma-btn--sm danger" id="planStopBtn">Stop server</button>'
      : `<button class="luma-btn primary luma-btn--sm" id="planStartBtn"${busy ? ' disabled' : ''}>${state === 'error' ? 'Start again' : 'Start server'}</button>`;
    return `
                <div class="plan-action-row">
                    ${button}
                    ${state === 'idle' ? '<span class="plan-note-muted">The server is stopped; these notes describe its last start.</span>' : ''}
                </div>`;
  }

  static _error(title, advice) {
    return `
                    <div class="plan-error">
                        <div class="plan-error-title">${title}</div>
                        <div class="plan-error-advice">${advice}</div>
                    </div>`;
  }
}
