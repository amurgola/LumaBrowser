const XmlToolCallParser = require('./XmlToolCallParser');

class DsmlToolCallParser {
  static BAR = '[｜|]';

  static OPEN = new RegExp(`<${DsmlToolCallParser.BAR}DSML${DsmlToolCallParser.BAR}\\s*(?:calls|tool_calls|function_calls|invoke\\b)`, 'i');

  static EARLY = /<\uFF5CDS|<\|DSML/;

  static INVOKE = new RegExp(
    `<${DsmlToolCallParser.BAR}DSML${DsmlToolCallParser.BAR}\\s*invoke\\s+name="([^"]+)"\\s*>([\\s\\S]*?)(</${DsmlToolCallParser.BAR}DSML${DsmlToolCallParser.BAR}\\s*invoke>|$)`,
    'gi',
  );

  static PARAM = new RegExp(
    `<${DsmlToolCallParser.BAR}DSML${DsmlToolCallParser.BAR}\\s*parameter\\s+name="([^"]+)"(?:\\s+string="(true|false)")?\\s*>([\\s\\S]*?)</${DsmlToolCallParser.BAR}DSML${DsmlToolCallParser.BAR}\\s*parameter>`,
    'gi',
  );

  static hasOpener(content) {
    return DsmlToolCallParser.OPEN.test(String(content || ''));
  }

  static parseAll(content) {
    if (!content) return [];
    const s = String(content);
    if (!DsmlToolCallParser.hasOpener(s)) return [];
    const out = [];
    const re = new RegExp(DsmlToolCallParser.INVOKE.source, 'gi');
    let m;
    while ((m = re.exec(s)) !== null) {
      const closed = m[3] !== '';
      const params = DsmlToolCallParser.parseParams(m[2]);
      if (!closed && params.count === 0) continue;
      const call = { tool: m[1], params: params.values };
      if (!closed) call.__repaired = true;
      out.push(call);
      if (m[0].length === 0) re.lastIndex += 1;
    }
    return out;
  }

  static parseFirst(content) {
    const calls = DsmlToolCallParser.parseAll(content);
    return calls.length ? calls[0] : null;
  }

  static parseParams(body) {
    const values = {};
    let count = 0;
    const re = new RegExp(DsmlToolCallParser.PARAM.source, 'gi');
    let pm;
    while ((pm = re.exec(String(body || ''))) !== null) {
      const raw = pm[3].trim();
      values[pm[1]] = pm[2] === 'true' ? raw : XmlToolCallParser.coerceParam(raw);
      count += 1;
    }
    return { values, count };
  }

  static toolName(buf) {
    const m = new RegExp(`<${DsmlToolCallParser.BAR}DSML${DsmlToolCallParser.BAR}\\s*invoke\\s+name="([^"]+)"`, 'i').exec(String(buf || ''));
    return m ? m[1] : null;
  }

  static paramValue(buf, key, max) {
    const re = new RegExp(
      `<${DsmlToolCallParser.BAR}DSML${DsmlToolCallParser.BAR}\\s*parameter\\s+name="${key}"[^>]*>([\\s\\S]{1,${max}}?)</${DsmlToolCallParser.BAR}DSML${DsmlToolCallParser.BAR}\\s*parameter>`,
      'i',
    );
    const m = re.exec(String(buf || ''));
    return m ? m[1].trim() : null;
  }
}

module.exports = DsmlToolCallParser;
