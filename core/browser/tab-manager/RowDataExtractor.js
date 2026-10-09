const ExtractDataScript = require('./ExtractDataScript');
const TabPage = require('./TabPage');

class RowDataExtractor {
  static DIAGNOSTIC_LISTS = ['duplicateFieldGroups', 'nullFields', 'constantFields'];

  static async extract(page, options = {}) {
    const { baseSelector, childSelectors, preferTableStructure } = options;
    if (!baseSelector || !childSelectors) return { success: false, error: 'baseSelector and childSelectors are required' };
    const result = await page.run(ExtractDataScript.build({ baseSelector, childSelectors, preferTableStructure }));
    if (!result || !result.success) return { success: false, error: (result && result.error) || TabPage.NO_RESULT_ERROR };
    return RowDataExtractor._shape(result);
  }

  static _shape(result) {
    const out = { success: true, data: result.data, rowCount: result.rowCount };
    if (result.extractionMode) out.extractionMode = result.extractionMode;
    for (const key of RowDataExtractor.DIAGNOSTIC_LISTS) {
      if (Array.isArray(result[key]) && result[key].length > 0) out[key] = result[key];
    }
    return out;
  }
}

module.exports = RowDataExtractor;
