class NetworkLogQuery {
  static UNAVAILABLE = 'Network interceptor not available';

  static read(networkInterceptor, tabId, urlFilter) {
    if (!networkInterceptor) return null;
    return NetworkLogQuery.filter(networkInterceptor.getRequestLog(tabId), urlFilter);
  }

  static filter(logs, urlFilter) {
    if (!urlFilter) return logs;
    return logs.filter((entry) => entry.url && entry.url.includes(urlFilter));
  }
}

module.exports = NetworkLogQuery;
