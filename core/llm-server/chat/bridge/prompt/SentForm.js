const ManualDelivery = require('./ManualDelivery');

class SentForm {
  static SEPARATOR = '\n\n';

  static durable(row) {
    const text = String((row && row.content) || '');
    const manuals = SentForm.manualsOf(row && row.sentContent, text);
    return manuals ? manuals + SentForm.SEPARATOR + text : text;
  }

  static manualsOf(sent, text) {
    if (typeof sent !== 'string' || !sent) return '';
    const start = sent.indexOf(ManualDelivery.HEADER);
    if (start === -1) return '';
    const end = text ? sent.lastIndexOf(SentForm.SEPARATOR + text) : -1;
    return end > start ? sent.slice(start, end) : sent.slice(start).trimEnd();
  }
}

module.exports = SentForm;
