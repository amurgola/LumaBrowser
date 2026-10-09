class McpPayload {
  static data(result) {
    if (result.data) return McpPayload._withoutInnerSuccess(result.data);
    const { success, error, urlChanged, newUrl, ...rest } = result;
    return Object.keys(rest).length > 0 ? rest : {};
  }

  static iso(ms) {
    return typeof ms === 'number' ? new Date(ms).toISOString() : (ms ?? null);
  }

  static _withoutInnerSuccess(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data) || !('success' in data)) return data;
    const { success, ...clean } = data;
    return clean;
  }
}

module.exports = McpPayload;
