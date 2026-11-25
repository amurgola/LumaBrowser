function openProtonMail(messageId, subject) {
  const rows = [...document.querySelectorAll('[data-testid^="message-item:"]')];
  const same = (text) => String(text || '').trim().toLowerCase() === String(subject || '').trim().toLowerCase();
  const row = rows.find((r) => messageId && r.getAttribute('data-element-id') === messageId)
    || rows.find((r) => subject && same(r.getAttribute('data-testid').slice('message-item:'.length)));
  if (!row) return false;
  row.click();
  return true;
}

function readProtonMail() {
  const lines = (text) => String(text || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const textOf = (element) => (element ? element.innerText || element.textContent || '' : '');
  const views = [...document.querySelectorAll('[data-testid^="message-view-"]')];
  const opened = views.map((view) => {
    const frame = view.querySelector('iframe[data-testid="content-iframe"]');
    let body = '';
    try { body = textOf(frame && frame.contentDocument && frame.contentDocument.body); } catch (_) { body = ''; }
    if (!lines(body).length) return '';
    const header = lines(textOf(view.querySelector('[data-testid^="message-header-expanded"]')));
    const from = lines(textOf(view.querySelector('[data-testid="recipients:sender"]'))).pop() || '';
    const to = header.indexOf('To') >= 0 ? header[header.indexOf('To') + 1] || '' : '';
    const sent = header.find((line) => / at [0-9]{1,2}:[0-9]{2}/.test(line)) || '';
    return [from ? `From: ${from}` : '', to ? `To: ${to}` : '', sent ? `Sent: ${sent}` : '', lines(body).join('\n')].filter(Boolean).join('\n');
  }).filter(Boolean).reverse();
  if (!opened.length) return '';
  const subject = lines(textOf(document.querySelector('[data-testid="conversation-header:subject"]'))).pop() || '';
  const folded = views.length - opened.length;
  return [`Subject: ${subject}${folded > 0 ? ` (${folded} earlier message${folded === 1 ? '' : 's'} in this conversation not shown)` : ''}`, ...opened].join('\n\n');
}

class ProtonMailbox {
  static ACCOUNT = /\/u\/(\d+)\//;
  static LIST = '[data-testid^="message-item:"]';
  static BODY = 'iframe[data-testid="content-iframe"]';
  static READ_JS = `(${readProtonMail.toString()})()`;

  static searchAddress(item, tab) {
    const last = item.lastNotification || {};
    const account = (String(last.url || '').match(ProtonMailbox.ACCOUNT) || String((tab && tab.url) || '').match(ProtonMailbox.ACCOUNT) || [])[1];
    const keyword = String(item.title || last.sender || '').trim();
    if (account === undefined || !keyword) return null;
    return `https://mail.proton.me/u/${account}/all-mail#keyword=${encodeURIComponent(keyword)}`;
  }

  static async open(page, item) {
    const messageId = (item.lastNotification || {}).tag || '';
    if (messageId) await page.waitFor(`[data-element-id="${messageId.replace(/["\\]/g, '')}"]`);
    const clicked = await page.run(`(${openProtonMail.toString()})(${JSON.stringify(messageId)}, ${JSON.stringify(item.title || '')})`);
    return clicked === true && page.waitFor(ProtonMailbox.BODY);
  }
}

module.exports = ProtonMailbox;
