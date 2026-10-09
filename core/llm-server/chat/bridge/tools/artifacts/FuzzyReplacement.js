class FuzzyReplacement {
  static apply(buf, find, replace, replaceAll) {
    const srcLines = buf.split('\n');
    const findLines = find.split('\n');
    if (findLines.length === 0 || findLines.length > srcLines.length) return { ok: false, code: 'notfound' };
    const windows = FuzzyReplacement._windows(srcLines, findLines);
    if (windows.length === 0) return { ok: false, code: 'notfound' };
    if (windows.length > 1 && !replaceAll) return { ok: false, code: 'ambiguous', count: windows.length };
    const targets = (replaceAll ? [...windows] : [windows[0]]).sort((a, b) => b - a);
    for (const j of targets) FuzzyReplacement._replaceWindow(srcLines, j, findLines, replace);
    return { ok: true, buf: srcLines.join('\n'), count: targets.length };
  }

  static _windows(srcLines, findLines) {
    const fNorm = findLines.map(FuzzyReplacement._trim);
    const windows = [];
    for (let j = 0; j + findLines.length <= srcLines.length; j++) {
      if (fNorm.every((line, k) => FuzzyReplacement._trim(srcLines[j + k]) === line)) windows.push(j);
    }
    return windows;
  }

  static _replaceWindow(srcLines, j, findLines, replace) {
    if (replace === '') {
      srcLines.splice(j, findLines.length);
      return;
    }
    const fk = findLines.findIndex((l) => l.trim() !== '');
    const modelBase = fk >= 0 ? FuzzyReplacement._lead(findLines[fk]) : '';
    const actualBase = fk >= 0 ? FuzzyReplacement._lead(srcLines[j + fk]) : '';
    const rebased = replace.split('\n').map((line) => FuzzyReplacement._rebase(line, modelBase, actualBase));
    srcLines.splice(j, findLines.length, ...rebased);
  }

  static _rebase(line, modelBase, actualBase) {
    if (line.trim() === '') return '';
    const lead = FuzzyReplacement._lead(line);
    const extra = lead.startsWith(modelBase) ? lead.slice(modelBase.length) : '';
    return actualBase + extra + line.slice(lead.length);
  }

  static _trim(s) {
    return s.replace(/^[ \t]+/, '').replace(/[ \t\r]+$/, '');
  }

  static _lead(s) {
    return (s.match(/^[ \t]*/) || [''])[0];
  }
}

module.exports = FuzzyReplacement;
