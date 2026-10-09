const HfHubClient = require('./HfHubClient');

class HfModelSearch {
  static SORTS = ['downloads', 'likes', 'lastModified'];

  static MAX_LIMIT = 100;

  static async search({ query = '', sort = 'downloads', limit = 20, signal, mlx = false } = {}) {
    const params = HfModelSearch._buildParams({ query, sort, limit, mlx });
    const rows = await HfHubClient.get(`${HfHubClient.BASE}/api/models?${params.toString()}`, { signal });
    return (Array.isArray(rows) ? rows : []).map(HfModelSearch._toResult).filter((row) => row.repoId);
  }

  static _buildParams({ query, sort, limit, mlx }) {
    const params = new URLSearchParams({
      filter: mlx ? 'mlx' : 'gguf',
      sort: HfModelSearch.SORTS.includes(sort) ? sort : 'downloads',
      direction: '-1',
      limit: String(Math.max(1, Math.min(HfModelSearch.MAX_LIMIT, limit))),
    });
    const search = HfModelSearch._searchText(query, mlx);
    if (search) params.set('search', search);
    return params;
  }

  static _searchText(query, mlx) {
    const text = String(query || '').trim();
    if (!text || mlx || /\bgguf\b/i.test(text)) return text;
    return `${text} gguf`;
  }

  static _toResult(row) {
    const repoId = row.id || row.modelId || '';
    const { author, name } = HfHubClient.splitRepoId(repoId);
    return {
      repoId,
      author,
      name: name || repoId,
      downloads: Number(row.downloads) || 0,
      likes: Number(row.likes) || 0,
      updatedAt: row.lastModified || row.createdAt || null,
      gated: !!row.gated,
    };
  }
}

module.exports = HfModelSearch;
