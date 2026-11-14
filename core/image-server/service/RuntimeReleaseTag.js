class RuntimeReleaseTag {
  static SCHEMES = [
    { name: 'luma', pattern: /^luma-b(\d+)$/i },
    { name: 'master', pattern: /^master-(\d+)(?:-|$)/i },
  ];

  static installedTag(runtime) {
    const release = runtime && runtime.manifest && runtime.manifest.release;
    return release && typeof release.tag === 'string' && release.tag ? release.tag : null;
  }

  static isOlder(installedTag, minimumTag) {
    const installed = RuntimeReleaseTag.parse(installedTag);
    const minimum = RuntimeReleaseTag.parse(minimumTag);
    if (!installed || !minimum || installed.scheme !== minimum.scheme) return false;
    return installed.build < minimum.build;
  }

  static parse(tag) {
    const text = String(tag || '').trim();
    for (const scheme of RuntimeReleaseTag.SCHEMES) {
      const match = scheme.pattern.exec(text);
      if (match) return { scheme: scheme.name, build: Number(match[1]) };
    }
    return null;
  }
}

module.exports = RuntimeReleaseTag;
