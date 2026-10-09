const HfHubClient = require('./HfHubClient');

class HfReadme {
  static MAX_CHARS = 256 * 1024;

  static TRUNCATION_NOTE = '\n\n…(truncated)';

  static FRONTMATTER = /^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n/;

  static async fetch(repoId, { signal } = {}) {
    const id = HfHubClient.requireRepoId(repoId);
    const raw = await HfReadme._fetchRaw(id, signal);
    if (raw === null) return null;
    return HfReadme._truncate(raw.replace(HfReadme.FRONTMATTER, ''));
  }

  static async _fetchRaw(id, signal) {
    const data = await HfHubClient.getRepoFile(id, 'README.md', {
      signal,
      accept: 'text/markdown, text/plain, */*',
      responseType: 'text',
      maxContentLength: HfReadme.MAX_CHARS * 2,
      transformResponse: (body) => body,
    });
    if (data === null) return null;
    return typeof data === 'string' ? data : String(data);
  }

  static _truncate(markdown) {
    if (markdown.length <= HfReadme.MAX_CHARS) return markdown;
    return markdown.slice(0, HfReadme.MAX_CHARS) + HfReadme.TRUNCATION_NOTE;
  }
}

module.exports = HfReadme;
