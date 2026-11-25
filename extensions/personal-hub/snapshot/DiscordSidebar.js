const ConversationList = require('./ConversationList');

function listedDiscordConversations() {
  const rows = [];
  for (const link of document.querySelectorAll('a[href^="/channels/@me/"]')) {
    const label = link.getAttribute('aria-label') || '';
    const end = label.search(/ \((direct|group) message\)/);
    if (end > 0) rows.push({ id: link.getAttribute('href').slice('/channels/'.length), name: label.slice(0, end).replace(/^unread, /i, '') });
  }
  let category = '';
  for (const item of document.querySelectorAll('[data-list-item-id^="channels___"]')) {
    const label = item.getAttribute('aria-label') || '';
    const href = item.getAttribute('href') || '';
    if (/ \(category\)$/.test(label)) { category = label.replace(/ \(category\)$/, ''); continue; }
    const end = label.search(/ \((text|announcement) channel\)/);
    if (end <= 0 || !href.startsWith('/channels/')) continue;
    const name = label.slice(0, end).split(', ').pop();
    rows.push({ id: href.slice('/channels/'.length), name: `#${name}${category ? ` (${category})` : ''}` });
  }
  return rows;
}

async function walkDiscordServers(list) {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const nav = () => [...document.querySelectorAll('[data-list-item-id^="guildsnav___"]')];
  const idOf = (item) => item.getAttribute('data-list-item-id').slice('guildsnav___'.length);
  const folded = nav().filter((item) => item.getAttribute('aria-expanded') === 'false').map(idOf);
  const toggle = async (id) => {
    const item = document.querySelector(`[data-list-item-id="guildsnav___${id}"]`);
    if (item) { item.click(); await sleep(200); }
  };
  for (const id of folded) await toggle(id);
  const found = new Map();
  const keep = () => { for (const row of list()) found.set(row.id, row); };
  keep();
  const servers = nav().filter((item) => !item.hasAttribute('aria-expanded') && /^[0-9]{15,}$/.test(idOf(item))).map(idOf);
  for (const server of servers) {
    const item = document.querySelector(`[data-list-item-id="guildsnav___${server}"]`);
    if (!item) continue;
    item.click();
    for (let waited = 0; waited < 2500 && !document.querySelector(`a[href^="/channels/${server}/"]`); waited += 100) await sleep(100);
    await sleep(150);
    keep();
  }
  for (const id of folded) await toggle(id);
  return [...found.values()];
}

class DiscordSidebar extends ConversationList {
  static HOME = 'https://discord.com/channels/@me';
  static READY = '[data-list-item-id^="guildsnav___"]';
  static ROWS_JS = `(${listedDiscordConversations.toString()})().filter((row) => row.id.startsWith('@me/'))`;
  static SCAN_JS = `(${walkDiscordServers.toString()})(${listedDiscordConversations.toString()})`;
  static CONVERSATION_ID = /^(@me|[0-9]{15,})\/[0-9]{15,}$/;
  static KNOWN_KEY = 'discord.conversations';
  static SPACE = 'discord';

  static spaceOf(tab) {
    try { return new URL(String((tab && tab.url) || '')).hostname === 'discord.com' ? DiscordSidebar.SPACE : null; } catch (_) { return null; }
  }

  static home() {
    return DiscordSidebar.HOME;
  }

  static address(_space, id) {
    return `https://discord.com/channels/${id}`;
  }

  static conversations(rows) {
    const listed = super.conversations(rows);
    const times = new Map();
    for (const row of listed) times.set(this.key(row.name), new Set([...(times.get(this.key(row.name)) || []), row.id]));
    return listed.filter((row) => times.get(this.key(row.name)).size === 1);
  }

  static key(name) {
    return String(name || '').trim().toLowerCase();
  }
}

module.exports = DiscordSidebar;
