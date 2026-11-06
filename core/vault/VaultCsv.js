class VaultCsv {
  static COLUMNS = {
    origin: ['url', 'login_uri', 'website', 'web site', 'uri'],
    username: ['username', 'login_username', 'login name', 'user', 'email'],
    password: ['password', 'login_password'],
    title: ['name', 'title'],
    notes: ['note', 'notes', 'extra'],
    totp: ['login_totp', 'totp', 'otpauth'],
  };

  static EXPORT_HEADER = ['name', 'url', 'username', 'password', 'note'];

  static parse(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    const src = String(text || '').replace(/^﻿/, '');
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (quoted) {
        if (c === '"' && src[i + 1] === '"') { field += '"'; i++; } else if (c === '"') quoted = false; else field += c;
      } else if (c === '"') {
        quoted = true;
      } else if (c === ',') {
        row.push(field); field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && src[i + 1] === '\n') i++;
        row.push(field); field = '';
        rows.push(row); row = [];
      } else {
        field += c;
      }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.some((f) => f !== ''));
  }

  static read(text) {
    const rows = VaultCsv.parse(text);
    if (!rows.length) return { logins: [], skipped: 0 };
    const map = VaultCsv._columns(rows[0]);
    if (map.origin == null || map.password == null) {
      throw new Error('This file is not a password export: it needs a url and a password column.');
    }
    const logins = [];
    let skipped = 0;
    for (const row of rows.slice(1)) {
      const get = (key) => (map[key] == null ? '' : String(row[map[key]] || '').trim());
      const login = { origin: get('origin'), username: get('username'), password: row[map.password] || '', title: get('title'), notes: get('notes') };
      if (get('totp')) login.totp = get('totp');
      if (!login.origin || !login.password) { skipped++; continue; }
      logins.push(login);
    }
    return { logins, skipped };
  }

  static _columns(header) {
    const names = header.map((h) => String(h || '').trim().toLowerCase());
    const map = {};
    for (const [key, options] of Object.entries(VaultCsv.COLUMNS)) {
      for (const option of options) {
        const at = names.indexOf(option);
        if (at >= 0) { map[key] = at; break; }
      }
    }
    return map;
  }

  static write(logins) {
    const cell = (v) => {
      const s = String(v == null ? '' : v);
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [VaultCsv.EXPORT_HEADER.join(',')];
    for (const l of logins) {
      const name = l.title || VaultCsv._host(l.origin);
      lines.push([name, l.origin, l.username, l.password, l.notes].map(cell).join(','));
    }
    return `${lines.join('\r\n')}\r\n`;
  }

  static _host(origin) {
    try { return new URL(origin).hostname; } catch (_) { return origin || ''; }
  }
}

module.exports = VaultCsv;
