class OpenAiModelList {
  static build(rows, upstream) {
    const data = OpenAiModelList._withLoadedFirst(rows, upstream)
      .filter((row) => row && row.id)
      .map((row) => OpenAiModelList._entry(row.id, upstream));
    return {
      object: 'list',
      data,
      has_more: false,
      first_id: data.length ? data[0].id : null,
      last_id: data.length ? data[data.length - 1].id : null,
    };
  }

  static single(id, upstream) {
    return { id, object: 'model', created: 0, owned_by: 'lumabrowser', luma_loaded: OpenAiModelList._isLoaded(id, upstream) };
  }

  static _withLoadedFirst(rows, upstream) {
    const list = Array.isArray(rows) ? rows.slice() : [];
    if (upstream && !list.some((row) => row && row.id === upstream.modelId)) list.unshift({ id: upstream.modelId, current: true });
    return list;
  }

  static _entry(id, upstream) {
    return {
      id,
      object: 'model',
      type: 'model',
      created: 0,
      created_at: '1970-01-01T00:00:00Z',
      display_name: id,
      owned_by: 'lumabrowser',
      luma_loaded: OpenAiModelList._isLoaded(id, upstream),
    };
  }

  static _isLoaded(id, upstream) {
    return !!(upstream && upstream.modelId === id);
  }
}

module.exports = OpenAiModelList;
