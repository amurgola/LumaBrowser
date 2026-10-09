const fs = require('fs');
const path = require('path');

class KokoroTokenPatcher {
  static ALIASES = [
    ['ɚ', 'ə'],
    ['ɝ', 'ɜ'],
  ];

  static FALLBACK_SYMBOL = 'ə';

  static patch(modelDir) {
    const tokensPath = path.join(modelDir, 'tokens.txt');
    const text = KokoroTokenPatcher._readTokens(tokensPath);
    if (text == null) return false;
    const additions = KokoroTokenPatcher._missingAliases(text.split(/\r?\n/));
    if (!additions.length) return false;
    const separator = text.endsWith('\n') ? '' : '\n';
    fs.appendFileSync(tokensPath, separator + additions.join('\n') + '\n');
    return true;
  }

  static _readTokens(tokensPath) {
    try {
      return fs.readFileSync(tokensPath, 'utf8');
    } catch (_) {
      return null;
    }
  }

  static _missingAliases(lines) {
    const additions = [];
    for (const [missing, near] of KokoroTokenPatcher.ALIASES) {
      if (KokoroTokenPatcher._idOf(lines, missing) != null) continue;
      const nearId = KokoroTokenPatcher._idOf(lines, near) ?? KokoroTokenPatcher._idOf(lines, KokoroTokenPatcher.FALLBACK_SYMBOL);
      if (nearId != null) additions.push(`${missing} ${nearId}`);
    }
    return additions;
  }

  static _idOf(lines, symbol) {
    const line = lines.find((candidate) => candidate.startsWith(symbol + ' '));
    return line ? line.slice(symbol.length + 1).trim() : null;
  }
}

module.exports = KokoroTokenPatcher;
