class HfModelInput {
  static HF_HOST = /^(?:www\.)?(?:huggingface\.co|hf\.co)\/(.+)$/i;
  static SHORTHAND = /^([^/\s]+)\/([^/\s]+)\/(.+\.gguf)$/i;
  static RESOLVE_URL_REPO = /^https?:\/\/(?:www\.)?(?:huggingface\.co|hf\.co)\/([^/\s]+\/[^/\s]+)\/resolve\//i;

  static resolve(input) {
    const urlPath = HfModelInput._urlPath(HfModelInput._bare(input));
    const clean = urlPath.split('?')[0];
    if (!/\.gguf$/i.test(clean)) throw new Error('That doesn’t point at a .gguf file.');
    return { url: `https://huggingface.co/${clean}?download=true`, file: decodeURIComponent(clean.split('/').pop()) };
  }

  static repoDirName(repoId) {
    return String(repoId || '').replace(/[\\/]+/g, '__').replace(/[^A-Za-z0-9._-]/g, '_');
  }

  static repoIdFromUrl(url) {
    const m = HfModelInput.RESOLVE_URL_REPO.exec(String(url || ''));
    return m ? m[1] : null;
  }

  static fileFromUrl(url) {
    try {
      return decodeURIComponent(new URL(url).pathname.split('/').pop());
    } catch (_) {
      return String(url).split('?')[0].split('/').pop();
    }
  }

  static _bare(input) {
    const s = String(input || '').trim();
    if (!s) throw new Error('Paste a HuggingFace .gguf URL or owner/repo/file.gguf path.');
    return s.replace(/^https?:\/\//i, '');
  }

  static _urlPath(s) {
    const hfHost = s.match(HfModelInput.HF_HOST);
    if (hfHost) {
      const urlPath = hfHost[1].replace('/blob/', '/resolve/');
      if (!/\/resolve\//.test(urlPath)) throw new Error('Link a specific .gguf file (use its "download" / resolve URL).');
      return urlPath;
    }
    const m = s.match(HfModelInput.SHORTHAND);
    if (!m) throw new Error('Use a full .gguf URL, or owner/repo/file.gguf.');
    return `${m[1]}/${m[2]}/resolve/main/${m[3]}`;
  }
}

module.exports = HfModelInput;
