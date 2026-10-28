const ElementDigest = require('../extraction/ElementDigest');
const ElementDigestFormatter = require('./ElementDigestFormatter');
const PageBlockDetector = require('./PageBlockDetector');

class PageObserver {
  static async observe(page) {
    const result = await page.run(ElementDigest.SCRIPT);
    if (!result || !result.success) return { success: false, error: (result && result.error) || 'digest failed' };
    return { success: true, data: PageObserver._summary(result) };
  }

  static _summary(result) {
    const blocked = PageBlockDetector.detect(result);
    const text = ElementDigestFormatter.format(result);
    return {
      text: blocked ? `${text}\n${blocked.note}` : text,
      count: result.viewport.length + result.below.length,
      dropped: result.dropped || 0,
      title: result.title,
      url: result.url,
      ...(blocked ? { blocked: { kind: blocked.kind, label: blocked.label } } : {}),
    };
  }
}

module.exports = PageObserver;
