import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class ConversationJobsHtml {
  static build(jobs, stopping = new Set()) {
    return jobs.map((job) => ConversationJobsHtml.row(job, stopping.has(job.id))).join('');
  }

  static row(job, isStopping) {
    const esc = HtmlEscaper.escape;
    const percent = ConversationJobsHtml.percent(job);
    const bar = percent == null ? '' : `<div class="cm-job-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><div class="cm-job-bar-fill" style="width:${percent}%"></div></div>`;
    return `<div class="cm-job" data-job-id="${esc(job.id)}">`
      + '<div class="cm-job-head"><span class="cm-job-dot"></span>'
      + `<span class="cm-job-title">${esc(job.title)}</span>`
      + `<span class="cm-job-detail">${esc(ConversationJobsHtml.line(job, isStopping))}</span>`
      + ConversationJobsHtml._cancel(job, isStopping)
      + `</div>${bar}</div>`;
  }

  static line(job, isStopping) {
    if (isStopping) return 'stopping…';
    const facts = [];
    if (job.detail) facts.push(job.detail);
    if (job.step != null && job.totalSteps) facts.push(`step ${job.step} of ${job.totalSteps}`);
    if (job.timeLeft) facts.push(`about ${job.timeLeft} left`);
    return facts.join(' · ');
  }

  static percent(job) {
    const total = Number(job.totalSteps);
    const step = Number(job.step);
    if (job.step == null || !(total > 0) || !(step >= 0)) return null;
    return Math.max(0, Math.min(100, Math.round((step / total) * 100)));
  }

  static _cancel(job, isStopping) {
    if (!job.cancellable) return '';
    return `<button class="cm-job-cancel" data-job-cancel="${HtmlEscaper.escape(job.id)}"${isStopping ? ' disabled' : ''}>Cancel</button>`;
  }
}
