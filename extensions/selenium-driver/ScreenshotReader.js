const WebDriverError = require('./WebDriverError');

class ScreenshotReader {
  constructor(browser) {
    this._browser = browser;
  }

  async capture(tabId) {
    const res = await this._browser.screenshot(tabId, { fullPage: false });
    if (!res.success) throw WebDriverError.unableToCaptureScreen(res.error || 'screenshot failed');
    const data = res.data && res.data.screenshot;
    if (typeof data !== 'string') throw WebDriverError.unableToCaptureScreen('no screenshot data');
    return data.replace(/^data:image\/[^;]+;base64,/, '');
  }
}

module.exports = ScreenshotReader;
