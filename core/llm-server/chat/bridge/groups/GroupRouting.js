class GroupRouting {
  constructor(router) {
    const svc = router && router.llmServerService;
    this._groupRouter = (svc && svc.groupRouter) || null;
  }

  async route(prompt, activate) {
    if (!this._groupRouter || !prompt) return null;
    try {
      const keys = await this._groupRouter.classify(prompt);
      if (keys && keys.length) activate(keys);
      return keys;
    } catch (_) {
      return null;
    }
  }
}

module.exports = GroupRouting;
