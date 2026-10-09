class BackgroundStarts {
  static UPDATE_CHECK_MS = 3000;
  static LLM_PIN_MS = 3000;
  static IMAGE_PIN_MS = 6000;
  static GROUP_ROUTER_MS = 9000;

  constructor({ updateCheck, llmServerService, imageServerService, env, setTimeoutFn = setTimeout }) {
    this._updateCheck = updateCheck;
    this._llm = llmServerService;
    this._image = imageServerService;
    this._env = env;
    this._setTimeout = setTimeoutFn;
  }

  schedule() {
    if (!this._env.LUMA_DOCKER) this._setTimeout(() => this._updateCheck.autoCheck(), BackgroundStarts.UPDATE_CHECK_MS);
    this._setTimeout(() => this._llm.ramPin.apply(), BackgroundStarts.LLM_PIN_MS);
    this._setTimeout(() => this._image.ramPin.apply(), BackgroundStarts.IMAGE_PIN_MS);
    this._setTimeout(() => this._llm.groupRouter.apply(), BackgroundStarts.GROUP_ROUTER_MS);
  }
}

module.exports = BackgroundStarts;
