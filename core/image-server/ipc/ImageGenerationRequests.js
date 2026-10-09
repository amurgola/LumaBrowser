class ImageGenerationRequests {
  constructor(router) {
    this._router = router;
  }

  async generate(args, send) {
    try {
      return await this._router.generate({ ...args, send });
    } catch (err) {
      send('error', { message: err.message });
      return { success: false, error: err.message };
    }
  }

  abort() {
    global.__lumaImageAbortSeq = (Number(global.__lumaImageAbortSeq) || 0) + 1;
    this._router.abort();
  }
}

module.exports = ImageGenerationRequests;
