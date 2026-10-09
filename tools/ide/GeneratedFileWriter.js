const fs = require('fs');
const path = require('path');

class GeneratedFileWriter {
  static syncFiles(root, destDir, pairs, by) {
    for (const [from, to] of pairs) {
      const text = fs.readFileSync(path.join(root, from), 'utf8');
      GeneratedFileWriter.write(path.join(destDir, to), GeneratedFileWriter.stamp(to, text, `Copied from ${from} by ${by}. Do not edit here.`));
    }
  }

  static stamp(name, text, note) {
    if (name.endsWith('.html')) return text.replace(/^(<!doctype html>\r?\n)?/i, (m) => `${m}<!-- ${note} -->\n`);
    return `/* ${note} */\n${text}`;
  }

  static write(dst, body) {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    if (fs.existsSync(dst) && fs.readFileSync(dst, 'utf8') === body) return false;
    fs.writeFileSync(dst, body);
    return true;
  }
}

module.exports = GeneratedFileWriter;
