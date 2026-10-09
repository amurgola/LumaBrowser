export default class HfRepoUrl {
  static isRepoUrl(url) {
    if (!url) return false;
    let parsed;
    try { parsed = new URL(url); } catch (_) { return false; }
    if (!/(^|\.)huggingface\.co$/i.test(parsed.hostname)) return false;
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return false;
    return !parts.includes('resolve') && !parts.includes('blob');
  }
}
