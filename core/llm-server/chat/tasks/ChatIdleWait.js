class ChatIdleWait {
  static POLL_MS = 500;

  constructor({ getRouter, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) }) {
    this._getRouter = getRouter;
    this._sleep = sleep;
  }

  async until(settleMs = 0) {
    let quietFor = 0;
    while (this._streaming() || quietFor < settleMs) {
      quietFor = this._streaming() ? 0 : quietFor + ChatIdleWait.POLL_MS;
      await this._sleep(ChatIdleWait.POLL_MS);
    }
  }

  _streaming() {
    const router = this._getRouter();
    return !!(router && router.active);
  }
}

module.exports = ChatIdleWait;
