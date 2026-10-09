class RuntimeUpdateChecker {
  static DEFAULT_TTL_MS = 5 * 60 * 1000;

  static check(options) {
    return new RuntimeUpdateChecker(options).execute();
  }

  constructor({
    view,
    kind,
    fetchLatestRelease,
    fetchLatestPrerelease = null,
    cache,
    ttlMs = RuntimeUpdateChecker.DEFAULT_TTL_MS,
    now = Date.now(),
  }) {
    this._view = view;
    this._kind = kind;
    this._fetchLatestRelease = fetchLatestRelease;
    this._fetchLatestPrerelease = fetchLatestPrerelease;
    this._cache = cache;
    this._ttlMs = ttlMs;
    this._now = now;
    this._groups = new Map();
    this._updates = {};
  }

  async execute() {
    this._groupEligibleRuntimesByRepo();
    await this._resolveEveryGroup();
    return this._updates;
  }

  _groupEligibleRuntimesByRepo() {
    for (const runtime of (this._view && this._view.runtimes) || []) {
      if (!this._isEligible(runtime)) continue;
      this._addToGroup(runtime);
    }
  }

  _isEligible(runtime) {
    if (!runtime || runtime.kind !== this._kind) return false;
    if (!runtime.installed) return false;
    if (runtime.acquisition !== 'github-release') return false;
    if (runtime.source !== 'managed') return false;
    if (!RuntimeUpdateChecker._currentTag(runtime)) return false;
    return !!(runtime.repo && runtime.repo.owner && runtime.repo.repo);
  }

  _addToGroup(runtime) {
    const channel = this._channelFor(runtime);
    const key = RuntimeUpdateChecker._cacheKey(runtime.repo, channel);
    if (!this._groups.has(key)) this._groups.set(key, { repo: runtime.repo, channel, runtimes: [] });
    this._groups.get(key).runtimes.push({ id: runtime.id, currentTag: RuntimeUpdateChecker._currentTag(runtime) });
  }

  _channelFor(runtime) {
    const wantsPrerelease = runtime.manifest.release.channel === 'prerelease';
    return wantsPrerelease && this._fetchLatestPrerelease ? 'prerelease' : 'stable';
  }

  _resolveEveryGroup() {
    return Promise.all([...this._groups.entries()].map(([key, group]) => this._resolveGroup(key, group)));
  }

  async _resolveGroup(key, group) {
    const latest = await this._latestFor(key, group);
    for (const { id, currentTag } of group.runtimes) {
      this._updates[id] = RuntimeUpdateChecker._describeUpdate(currentTag, latest);
    }
  }

  async _latestFor(key, group) {
    const cached = this._cache.get(key);
    if (cached && (this._now - cached.at) <= this._ttlMs) return cached;
    const fresh = await this._fetchLatest(group);
    this._cache.set(key, fresh);
    return fresh;
  }

  async _fetchLatest({ repo, channel }) {
    const fetcher = channel === 'prerelease' ? this._fetchLatestPrerelease : this._fetchLatestRelease;
    try {
      const release = await fetcher(repo);
      return { at: this._now, tag: (release && release.tag_name) || null, error: null };
    } catch (err) {
      return { at: this._now, tag: null, error: (err && err.message) || String(err) };
    }
  }

  static _currentTag(runtime) {
    return runtime.manifest && runtime.manifest.release && runtime.manifest.release.tag;
  }

  static _cacheKey(repo, channel) {
    const base = `${repo.owner}/${repo.repo}`;
    return channel === 'prerelease' ? `${base}#prerelease` : base;
  }

  static _describeUpdate(currentTag, latest) {
    if (latest.error) {
      return { current: currentTag, latest: null, updateAvailable: false, error: latest.error };
    }
    return {
      current: currentTag,
      latest: latest.tag,
      updateAvailable: !!latest.tag && latest.tag !== currentTag,
      error: null,
    };
  }
}

module.exports = RuntimeUpdateChecker;
