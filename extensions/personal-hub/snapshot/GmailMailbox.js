function openGmailThread() {
  const row = document.querySelector('div[role="main"] tr.zA [data-legacy-thread-id]');
  const thread = row ? row.getAttribute('data-legacy-thread-id') : '';
  if (!thread) return false;
  window.location.hash = `#all/${thread}`;
  return true;
}

function readGmailThread() {
  const main = document.querySelector('div[role="main"]');
  if (!main) return '';
  const lines = (text) => String(text || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const textOf = (element) => (element ? element.innerText || element.textContent || '' : '');
  const opened = [...main.querySelectorAll('.adn')].map((message) => {
    const body = lines(textOf(message.querySelector('.a3s')));
    if (!body.length) return '';
    const sender = message.querySelector('.gD');
    const from = sender ? `${textOf(sender).trim()} <${sender.getAttribute('email') || ''}>` : '';
    const sent = textOf(message.querySelector('.g3')).trim();
    return [from ? `From: ${from}` : '', sent ? `Sent: ${sent}` : '', body.join('\n')].filter(Boolean).join('\n');
  }).filter(Boolean).reverse();
  if (!opened.length) return '';
  const folded = main.querySelectorAll('.kv, .kQ').length;
  const subject = textOf(main.querySelector('h2.hP')).trim();
  return [`Subject: ${subject}${folded > 0 ? ` (${folded} earlier message${folded === 1 ? '' : 's'} in this thread not shown)` : ''}`, ...opened].join('\n\n');
}

class GmailMailbox {
  static ACCOUNT = /\/mail\/u\/(\d+)\//;
  static LIST = 'div[role="main"] tr.zA';
  static BODY = 'div[role="main"] .a3s';
  static READ_JS = `(${readGmailThread.toString()})()`;

  static searchAddress(item, tab) {
    const last = item.lastNotification || {};
    const account = (String(last.url || '').match(GmailMailbox.ACCOUNT) || String((tab && tab.url) || '').match(GmailMailbox.ACCOUNT) || [])[1];
    const phrase = (text) => String(text || '').replace(/"/g, ' ').trim();
    const subject = phrase(item.title);
    const sender = phrase(last.sender);
    if (account === undefined || (!subject && !sender)) return null;
    const query = subject && subject !== sender ? `subject:("${subject}")` : `from:("${sender}")`;
    return `https://mail.google.com/mail/u/${account}/#search/${encodeURIComponent(query)}`;
  }

  static async open(page) {
    const found = await page.run(`(${openGmailThread.toString()})()`);
    return found === true && page.waitFor(GmailMailbox.BODY);
  }
}

module.exports = GmailMailbox;
