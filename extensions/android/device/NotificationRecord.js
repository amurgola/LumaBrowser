class NotificationRecord {
  static parse(key, record) {
    return {
      key,
      packageName: String(key).split('|')[1] || '',
      title: NotificationRecord.extra(record, 'android.title'),
      text: NotificationRecord.extra(record, 'android.bigText') || NotificationRecord.extra(record, 'android.text'),
      postedAtMs: Number((/when=(\d+)/.exec(record) || [])[1] || 0),
    };
  }

  static extra(record, name) {
    const pattern = new RegExp(`${name.replace(/\./g, '\\.')}=\\w+ \\(([\\s\\S]*?)\\)\\r?\\n`);
    const match = pattern.exec(String(record || ''));
    return match ? match[1] : '';
  }

  static keysIn(listing) {
    return String(listing || '').split(/\r?\n/).map((line) => line.trim()).filter((line) => line.split('|').length >= 5);
  }
}

module.exports = NotificationRecord;
