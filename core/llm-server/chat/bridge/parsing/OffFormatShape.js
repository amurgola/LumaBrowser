class OffFormatShape {
  static of(content) {
    const s = String(content || '');
    if (/<tool_call\b/i.test(s)) return 'xml-tool_call';
    if (/<function[\s=]/i.test(s)) return 'xml-function';
    if (/```json/i.test(s)) return 'json-fence';
    if (/```tool/i.test(s)) return 'malformed-tool-fence';
    return 'bare-json';
  }
}

module.exports = OffFormatShape;
