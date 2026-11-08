const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class GroundingCards {
  static load(dir, pack) {
    let files = [];
    try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort(); } catch (_) { return []; }
    const cards = [];
    for (const file of files) {
      const source = fs.readFileSync(path.join(dir, file), 'utf8');
      for (const card of GroundingCards.parse(source, { pack, file })) cards.push(card);
    }
    return cards;
  }

  static parse(source, { pack = '', file = '' } = {}) {
    const out = [];
    const sections = String(source || '').replace(/\r\n/g, '\n').split(/^## /m).slice(1);
    for (const section of sections) {
      const lines = section.split('\n');
      const title = lines.shift().trim();
      let tags = null;
      let group = '';
      let when = [];
      let unless = [];
      const body = [];
      const list = (t, n) => t.slice(n).split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
      for (const line of lines) {
        const t = line.trim();
        if (/^tags:/i.test(t)) tags = list(t, 5);
        else if (/^group:/i.test(t)) group = t.slice(6).trim().toLowerCase();
        else if (/^when:/i.test(t)) when = list(t, 5);
        else if (/^unless:/i.test(t)) unless = list(t, 7);
        else if (t) body.push(t);
      }
      if (!title || !tags || !tags.length || !body.length) continue;
      const id = pack + '/' + GroundingCards.slug(title);
      const text = title + '\nTags: ' + tags.join(', ') + (when.length ? '\nWhen: ' + when.join(', ') : '') + '\n' + body.join('\n');
      out.push({ id, pack, file, title, tags, when, unless, group, body: body.join('\n'), text, sha256: GroundingCards.sha256(text) });
    }
    return out;
  }

  static slug(title) {
    return String(title || '').toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  static sha256(text) {
    return crypto.createHash('sha256').update(String(text), 'utf8').digest('hex');
  }
}

module.exports = GroundingCards;
