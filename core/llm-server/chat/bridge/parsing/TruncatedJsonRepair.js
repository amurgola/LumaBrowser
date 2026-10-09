class TruncatedJsonRepair {
  static repair(text) {
    const str = String(text).replace(/[,\s]+$/, '');
    const open = TruncatedJsonRepair._unbalanced(str);
    if (!open.inString && open.curly <= 0 && open.square <= 0) return str;
    return str + TruncatedJsonRepair._closers(open);
  }

  static _closers({ inString, curly, square }) {
    return (inString ? '"' : '') + ']'.repeat(Math.max(0, square)) + '}'.repeat(Math.max(0, curly));
  }

  static _unbalanced(str) {
    const scan = { curly: 0, square: 0, inString: false, escaped: false };
    for (const char of str) TruncatedJsonRepair._step(scan, char);
    return scan;
  }

  static _step(scan, char) {
    if (scan.inString) {
      if (scan.escaped) scan.escaped = false;
      else if (char === '\\') scan.escaped = true;
      else if (char === '"') scan.inString = false;
      return;
    }
    if (char === '"') scan.inString = true;
    else if (char === '{') scan.curly++;
    else if (char === '}') scan.curly--;
    else if (char === '[') scan.square++;
    else if (char === ']') scan.square--;
  }
}

module.exports = TruncatedJsonRepair;
