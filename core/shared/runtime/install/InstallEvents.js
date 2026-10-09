class InstallEvents {
  static emitter(onEvent) {
    return (type, payload) => {
      try {
        if (typeof onEvent === 'function') onEvent(type, payload || {});
      } catch (_) {}
    };
  }

  static releaseFields(release) {
    return { tagName: release.tag_name, name: release.name, publishedAt: release.published_at, url: release.html_url };
  }

  static assetFields(asset) {
    return { name: asset.name, size: asset.size, contentType: asset.content_type, url: asset.browser_download_url };
  }
}

module.exports = InstallEvents;
