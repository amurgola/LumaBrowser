const HfHubClient = require('./HfHubClient');

class HfModelSearch {
  static SORTS = Object.freeze({ trending: 'trendingScore', downloads: 'downloads', likes: 'likes', lastModified: 'lastModified' });

  static DEFAULT_SORT = 'trending';

  static MAX_LIMIT = 100;

  static GGUF_FIELDS = Object.freeze(['downloads', 'likes', 'lastModified', 'gated', 'gguf', 'pipeline_tag', 'trendingScore']);

  static async search({ query = '', sort = HfModelSearch.DEFAULT_SORT, limit = 20, signal, mlx = false } = {}) {
    const params = HfModelSearch._buildParams({ query, sort, limit, mlx });
    const rows = await HfHubClient.get(`${HfHubClient.BASE}/api/models?${params.toString()}`, { signal });
    return (Array.isArray(rows) ? rows : []).map(HfModelSearch._toResult).filter((row) => row.repoId);
  }

  static sortField(sort) {
    return HfModelSearch.SORTS[sort] || HfModelSearch.SORTS[HfModelSearch.DEFAULT_SORT];
  }

  static _buildParams({ query, sort, limit, mlx }) {
    const params = new URLSearchParams({
      filter: mlx ? 'mlx' : 'gguf',
      sort: HfModelSearch.sortField(sort),
      direction: '-1',
      limit: String(Math.max(1, Math.min(HfModelSearch.MAX_LIMIT, limit))),
    });
    const search = HfModelSearch._searchText(query, mlx);
    if (search) params.set('search', search);
    if (!mlx) for (const field of HfModelSearch.GGUF_FIELDS) params.append('expand[]', field);
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
    const gguf = row.gguf && typeof row.gguf === 'object' ? row.gguf : null;
    return {
      repoId,
      author,
      name: name || repoId,
      downloads: Number(row.downloads) || 0,
      likes: Number(row.likes) || 0,
      trendingScore: Number(row.trendingScore) || 0,
      updatedAt: row.lastModified || row.createdAt || null,
      gated: !!row.gated,
      pipelineTag: typeof row.pipeline_tag === 'string' ? row.pipeline_tag : null,
      architecture: gguf && typeof gguf.architecture === 'string' ? gguf.architecture : null,
      paramsB: gguf && Number(gguf.total) > 0 ? Number(gguf.total) / 1e9 : null,
      maxContext: gguf && Number(gguf.context_length) > 0 ? Number(gguf.context_length) : null,
    };
  }
}

module.exports = HfModelSearch;
