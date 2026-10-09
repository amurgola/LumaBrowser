export default class PlanText {
  static summaryLines(lines, plain) {
    if (!plain) return lines || [];
    return (lines || []).map((l) => String(l)
      .replace(/\s*\((?:I?Q\d[\w]*|F16|BF16|F32|MXFP4)\)/g, '')
      .replace(/,\s*[\d,]+\s*token context/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim());
  }

  static failureHint(msg, failedStep) {
    const m = String(msg || '');
    if (/ENOSPC|no space|disk full/i.test(m)) return 'The download drive is full. Free some space, or choose a smaller setup.';
    if (/ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|network|socket hang up|fetch failed|429|503/i.test(m)) return 'The download was interrupted. Check your internet connection, then retry; it resumes where it stopped.';
    if (/out of memory|cuda.*memory|OOM/i.test(m)) return 'The model did not fit in memory. Choose a smaller setup.';
    if (failedStep === 'llm' && /runtime install failed/i.test(m)) return 'The chat runtime could not be installed. Retry, or choose a smaller setup that uses the CPU runtime.';
    return '';
  }

  static downloadLine(dlBytes, haveBytes, gb) {
    if (haveBytes <= 0) return `~${gb(dlBytes)} total download`;
    if (haveBytes >= dlBytes) return 'Already downloaded, nothing more to fetch';
    return `~${gb(dlBytes - haveBytes)} left to download (already have ${gb(haveBytes)} of ${gb(dlBytes)})`;
  }
}
