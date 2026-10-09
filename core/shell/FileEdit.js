class FileEdit {
  static NOT_FOUND = 'Could not find {n}.oldText in the file. Read the file and copy the exact text.';
  static OVERLAP = 'Two edits target overlapping text. Split them so each oldText is distinct.';

  static FOLDS = new Map([
    ['\u2018', "'"], ['\u2019', "'"], ['\u201B', "'"],
    ['\u201C', '"'], ['\u201D', '"'], ['\u201F', '"'],
    ['\u2013', '-'], ['\u2014', '-'], ['\u2212', '-'],
    ['\u00A0', ' '], ['\u2007', ' '], ['\u202F', ' '],
    ['\u200B', ''],
  ]);

  static apply(originalContent, edits) {
    const invalid = FileEdit._validateEdits(edits);
    if (invalid) return { ok: false, error: invalid };
    const eol = FileEdit._dominantEol(originalContent);
    const original = FileEdit._toLf(originalContent);
    const located = FileEdit._locateAll(original, edits);
    if (located.error) return { ok: false, error: located.error };
    const overlap = FileEdit._firstOverlap(located.edits);
    if (overlap) return { ok: false, error: overlap };
    return FileEdit._buildResult(original, located.edits, eol);
  }

  static countOccurrences(haystack, needle) {
    if (!needle) return 0;
    let count = 0;
    let index = haystack.indexOf(needle);
    while (index !== -1) {
      count++;
      index = haystack.indexOf(needle, index + needle.length);
    }
    return count;
  }

  static _validateEdits(edits) {
    if (!Array.isArray(edits) || edits.length === 0) {
      return 'No edits provided. Supply at least one {oldText, newText} replacement.';
    }
    for (const edit of edits) {
      if (!edit || typeof edit.oldText !== 'string' || typeof edit.newText !== 'string') {
        return 'Each edit must have string oldText and newText.';
      }
      if (edit.oldText.length === 0) return 'oldText must not be empty.';
    }
    return null;
  }

  static _locateAll(original, edits) {
    const normalized = FileEdit._normalize(original);
    const located = [];
    for (let i = 0; i < edits.length; i++) {
      const found = FileEdit._locate(original, normalized, edits[i].oldText);
      if (!found.ok) return { error: found.error.replace('{n}', `edits[${i}]`) };
      located.push({ ...found, newText: FileEdit._toLf(edits[i].newText) });
    }
    return { edits: located };
  }

  static _locate(original, normalized, rawOld) {
    const oldLf = FileEdit._toLf(rawOld);
    const exactCount = FileEdit.countOccurrences(original, oldLf);
    if (exactCount === 1) return FileEdit._exactMatch(original, oldLf);
    if (exactCount > 1) return FileEdit._ambiguous(exactCount, 'matches');
    return FileEdit._locateFuzzy(normalized, original.length, oldLf);
  }

  static _exactMatch(original, oldLf) {
    const start = original.indexOf(oldLf);
    return { ok: true, start, end: start + oldLf.length, usedFuzzy: false };
  }

  static _ambiguous(count, noun) {
    return { ok: false, error: `Found ${count} ${noun} for {n}.oldText. The text must be unique. Add more surrounding context.` };
  }

  static _locateFuzzy({ text, map }, originalLength, oldLf) {
    const needle = FileEdit._normalize(oldLf).text;
    const count = FileEdit.countOccurrences(text, needle);
    if (count === 0) return { ok: false, error: FileEdit.NOT_FOUND };
    if (count > 1) return FileEdit._ambiguous(count, 'fuzzy matches');
    const normStart = text.indexOf(needle);
    const afterLast = normStart + needle.length;
    const end = afterLast < map.length ? map[afterLast] : originalLength;
    return { ok: true, start: map[normStart], end, usedFuzzy: true };
  }

  static _firstOverlap(located) {
    const sorted = [...located].sort((a, b) => a.start - b.start);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start < sorted[i - 1].end) return FileEdit.OVERLAP;
    }
    return null;
  }

  static _buildResult(original, located, eol) {
    const content = FileEdit._splice(original, located);
    return {
      ok: true,
      content: FileEdit._restoreEol(content, eol),
      applied: located.map(({ start, end, usedFuzzy }) => ({ start, end, usedFuzzy })),
    };
  }

  static _splice(original, located) {
    const ordered = [...located].sort((a, b) => b.start - a.start);
    let out = original;
    for (const edit of ordered) out = out.slice(0, edit.start) + edit.newText + out.slice(edit.end);
    return out;
  }

  static _normalize(text) {
    const out = [];
    const map = [];
    let cursor = 0;
    const lines = text.split('\n');
    lines.forEach((line, lineIndex) => {
      FileEdit._appendFoldedLine(line.replace(/[ \t]+$/, ''), cursor, out, map);
      cursor += line.length;
      if (lineIndex < lines.length - 1) {
        out.push('\n');
        map.push(cursor);
        cursor += 1;
      }
    });
    map.push(text.length);
    return { text: out.join(''), map };
  }

  static _appendFoldedLine(trimmed, cursor, out, map) {
    for (let i = 0; i < trimmed.length; i++) {
      const folded = FileEdit._foldChar(trimmed[i]);
      if (!folded) continue;
      out.push(folded);
      map.push(cursor + i);
    }
  }

  static _foldChar(ch) {
    return FileEdit.FOLDS.has(ch) ? FileEdit.FOLDS.get(ch) : ch;
  }

  static _dominantEol(text) {
    const crlf = (String(text).match(/\r\n/g) || []).length;
    const lf = (String(text).match(/\n/g) || []).length - crlf;
    return crlf > lf ? '\r\n' : '\n';
  }

  static _toLf(text) {
    return String(text == null ? '' : text).replace(/\r\n/g, '\n');
  }

  static _restoreEol(text, eol) {
    return eol === '\r\n' ? text.replace(/\n/g, '\r\n') : text;
  }
}

module.exports = FileEdit;
