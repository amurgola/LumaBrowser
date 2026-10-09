class BalancedJson {
  static extractObject(text, start) {
    const scan = { depth: 0, inString: false, escaped: false };
    for (let i = start; i < text.length; i++) {
      if (BalancedJson._closesObject(scan, text[i])) return text.slice(start, i + 1);
    }
    return null;
  }

  static _closesObject(scan, char) {
    if (scan.inString) {
      BalancedJson._advanceInsideString(scan, char);
      return false;
    }
    if (char === '"') scan.inString = true;
    else if (char === '{') scan.depth++;
    else if (char === '}') return --scan.depth === 0;
    return false;
  }

  static _advanceInsideString(scan, char) {
    if (scan.escaped) scan.escaped = false;
    else if (char === '\\') scan.escaped = true;
    else if (char === '"') scan.inString = false;
  }
}

module.exports = BalancedJson;
