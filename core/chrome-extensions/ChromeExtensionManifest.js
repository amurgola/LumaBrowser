const fs = require('fs');
const path = require('path');

class ChromeExtensionManifest {
  static FILE_NAME = 'manifest.json';
  static MESSAGE_PATTERN = /^__MSG_(\w+)__$/;

  static read(dirPath) {
    const manifestPath = path.join(dirPath, ChromeExtensionManifest.FILE_NAME);
    if (!fs.existsSync(manifestPath)) throw new Error(`manifest.json not found in ${dirPath}`);
    return ChromeExtensionManifest.parse(fs.readFileSync(manifestPath, 'utf8'));
  }

  static parse(raw) {
    const text = String(raw).replace(/^﻿/, '');
    try {
      return JSON.parse(text);
    } catch (_) {}
    try {
      return JSON.parse(ChromeExtensionManifest.stripComments(text));
    } catch (err) {
      throw new Error(`Invalid manifest.json: ${err.message}`);
    }
  }

  static stripComments(raw) {
    const text = String(raw);
    let out = '';
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      const next = text[i + 1];
      if (ch === '"') {
        const end = ChromeExtensionManifest._stringEnd(text, i);
        out += text.slice(i, end);
        i = end;
      } else if (ch === '/' && next === '/') {
        while (i < text.length && text[i] !== '\n') i++;
      } else if (ch === '/' && next === '*') {
        const close = text.indexOf('*/', i + 2);
        i = close === -1 ? text.length : close + 2;
      } else {
        out += ch;
        i++;
      }
    }
    return out;
  }

  static _stringEnd(text, start) {
    let i = start + 1;
    while (i < text.length) {
      if (text[i] === '\\') i += 2;
      else if (text[i] === '"') return i + 1;
      else i++;
    }
    return text.length;
  }

  static localized(manifest, dirPath, field) {
    const value = manifest && manifest[field];
    const match = typeof value === 'string' ? ChromeExtensionManifest.MESSAGE_PATTERN.exec(value) : null;
    if (!match) return value || null;
    const messages = ChromeExtensionManifest._defaultMessages(manifest, dirPath);
    const key = Object.keys(messages).find((k) => k.toLowerCase() === match[1].toLowerCase());
    return (key && messages[key] && messages[key].message) || null;
  }

  static iconOf(manifest, size = 32) {
    const action = (manifest && (manifest.action || manifest.browser_action || manifest.page_action)) || {};
    const fromAction = action.default_icon;
    if (typeof fromAction === 'string') return ChromeExtensionManifest._relative(fromAction);
    const sizes = { ...((manifest && manifest.icons) || {}), ...(fromAction && typeof fromAction === 'object' ? fromAction : {}) };
    const ranked = Object.keys(sizes)
      .map((key) => ({ px: Number(key), file: sizes[key] }))
      .filter((icon) => Number.isFinite(icon.px) && typeof icon.file === 'string')
      .sort((a, b) => a.px - b.px);
    const pick = ranked.find((icon) => icon.px >= size) || ranked[ranked.length - 1];
    return pick ? ChromeExtensionManifest._relative(pick.file) : null;
  }

  static pagesOf(manifest) {
    const action = (manifest && (manifest.action || manifest.browser_action || manifest.page_action)) || {};
    const optionsUi = (manifest && manifest.options_ui) || {};
    return {
      popup: ChromeExtensionManifest._relative(action.default_popup),
      options: ChromeExtensionManifest._relative(optionsUi.page || (manifest && manifest.options_page)),
    };
  }

  static _defaultMessages(manifest, dirPath) {
    const locale = manifest.default_locale;
    if (!locale || !dirPath) return {};
    try {
      return ChromeExtensionManifest.parse(fs.readFileSync(path.join(dirPath, '_locales', locale, 'messages.json'), 'utf8'));
    } catch (_) {
      return {};
    }
  }

  static _relative(page) {
    return typeof page === 'string' && page.trim() ? page.trim().replace(/^\/+/, '') : null;
  }
}

module.exports = ChromeExtensionManifest;
