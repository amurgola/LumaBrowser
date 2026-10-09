const ElementDigest = require('../extraction/ElementDigest');
const ElementDigestFormatter = require('./ElementDigestFormatter');

class PageObserver {
  static async observe(page) {
    const result = await page.run(ElementDigest.SCRIPT);
    if (!result || !result.success) return { success: false, error: (result && result.error) || 'digest failed' };
    return { success: true, data: PageObserver._summary(result) };
  }

  static _summary(result) {
    return {
      text: ElementDigestFormatter.format(result),
      count: result.viewport.length + result.below.length,
      dropped: result.dropped || 0,
      title: result.title,
      url: result.url,
    };
  }
}

module.exports = PageObserver;
