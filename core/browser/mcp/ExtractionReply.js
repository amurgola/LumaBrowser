const ChildSelectorWarning = require('./ChildSelectorWarning');

class ExtractionReply {
  static TABLE_NOTE = 'Table-kind item: fields are the table\'s column headers (read from actual table structure), not the childSelector names.';

  static build(baseSelector, result, childSelectors) {
    const data = { baseSelector, rows: result.data, rowCount: result.rowCount };
    if (result.extractionMode === 'table-structure') {
      data.extractionMode = 'table-structure';
      data.note = ExtractionReply.TABLE_NOTE;
    }
    const warning = ChildSelectorWarning.compose(result, childSelectors);
    if (warning) data.childSelectorWarning = warning;
    return data;
  }
}

module.exports = ExtractionReply;
