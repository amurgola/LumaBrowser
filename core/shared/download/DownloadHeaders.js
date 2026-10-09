class DownloadHeaders {
  static SHA256_ETAG = /^"?([a-f0-9]{64})"?$/i;

  static totalFromHeaders(headers, offset) {
    const fromRange = DownloadHeaders._totalFromContentRange(headers['content-range']);
    if (fromRange != null) return fromRange;
    const length = Number(headers['content-length']);
    if (Number.isFinite(length) && length > 0) return offset + length;
    return 0;
  }

  static sha256FromHeaders(headers) {
    const raw = headers && headers['x-linked-etag'];
    if (!raw) return null;
    const match = DownloadHeaders.SHA256_ETAG.exec(String(raw).trim());
    return match ? match[1].toLowerCase() : null;
  }

  static _totalFromContentRange(contentRange) {
    if (!contentRange) return null;
    const match = /\/(\d+)\s*$/.exec(String(contentRange));
    return match ? Number(match[1]) : null;
  }
}

module.exports = DownloadHeaders;
