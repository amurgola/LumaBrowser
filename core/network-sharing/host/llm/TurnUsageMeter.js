class TurnUsageMeter {
  constructor(service, credential) {
    this._service = service;
    this._credential = credential;
    this._usage = null;
    this._images = 0;
    this._videos = 0;
    this._banked = false;
  }

  setUsage(usage) {
    if (usage) this._usage = usage;
  }

  usage() {
    return this._usage;
  }

  countArtifact(artifact) {
    if (artifact && artifact.type === 'image') this._images += 1;
    else if (artifact && artifact.type === 'video') this._videos += 1;
  }

  bank() {
    if (this._banked) return;
    this._banked = true;
    this._service.recordUsage(this._credential, {
      tokens: TurnUsageMeter.totalTokens(this._usage),
      images: this._images,
      videos: this._videos,
    });
  }

  static totalTokens(usage) {
    if (!usage) return 0;
    return usage.total_tokens || ((usage.prompt_tokens || 0) + (usage.completion_tokens || 0));
  }
}

module.exports = TurnUsageMeter;
