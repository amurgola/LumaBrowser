const axios = require('axios');

class HfRepoSiblings {
  static TIMEOUT_MS = 20000;
  static MAX_REDIRECTS = 5;

  static async fetch(repoId) {
    const res = await axios.get(`https://huggingface.co/api/models/${repoId}`, {
      timeout: HfRepoSiblings.TIMEOUT_MS,
      maxRedirects: HfRepoSiblings.MAX_REDIRECTS,
      headers: { Accept: 'application/json' },
    });
    const siblings = res.data && Array.isArray(res.data.siblings) ? res.data.siblings : [];
    return siblings.map((s) => s && s.rfilename).filter(Boolean);
  }
}

module.exports = HfRepoSiblings;
