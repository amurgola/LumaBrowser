class ConversationJobReminder {
  static build(jobs) {
    const running = Array.isArray(jobs) ? jobs.filter(Boolean) : [];
    if (!running.length) return null;
    return '[Background work started in this conversation is still running: '
      + running.map((job) => ConversationJobReminder.describe(job)).join('; ')
      + '. It continues on its own and its result will be posted in this conversation when it ends. '
      + 'Do not start it again. If the user asks about it, say it is still running and how far along it is.]';
  }

  static describe(job) {
    const facts = [];
    if (job.detail) facts.push(job.detail);
    if (job.step != null && job.totalSteps) facts.push(`step ${job.step} of ${job.totalSteps}`);
    if (job.timeLeft) facts.push(`about ${job.timeLeft} left`);
    return facts.length ? `${job.title} (${facts.join(', ')})` : job.title;
  }
}

module.exports = ConversationJobReminder;
