const ResponseText = require('../../../core/llm-service/ResponseText');
const ContactService = require('./ContactService');
const ContactProfilePrompt = require('./ContactProfilePrompt');

class ContactProfiler {
  static SLOT = 'personal-hub.summarizer';
  static LOG_DEPTH = 3000;
  static MAX_MESSAGES = 40;
  static MAX_CONVERSATIONS = 3;
  static MAX_TOKENS = 600;

  constructor({ contacts, inbox, snapshots, contexts = null, llm = null }) {
    this._contacts = contacts;
    this._inbox = inbox;
    this._snapshots = snapshots;
    this._contexts = contexts;
    this._llm = llm;
  }

  async learn(contactId) {
    const contact = this._contacts.get(contactId);
    if (!contact) throw new Error('Contact not found.');
    if (!this._llm) throw new Error('No language model service is available to the Hub.');
    const material = this._material(contact);
    if (!material.messages.length) return { contact, read: 0, added: 0 };
    const proposals = await this._ask(contact, material);
    const updated = this._contacts.propose(contactId, proposals);
    return { contact: updated, read: material.messages.length, added: updated.profile.suggested.length - contact.profile.suggested.length };
  }

  _material(contact) {
    const known = this._contexts ? this._contexts.list() : [];
    const messages = this._inbox.listNotifications({ limit: ContactProfiler.LOG_DEPTH })
      .filter((n) => this._from(n, contact.identities, known))
      .slice(0, ContactProfiler.MAX_MESSAGES)
      .map((n) => ({ at: n.receivedAt, app: n.app, text: [n.title !== n.sender ? n.title : '', n.body].filter(Boolean).join(': '), threadId: n.threadId }));
    const threadIds = [...new Set(messages.map((m) => m.threadId).filter(Boolean))];
    const conversations = Object.values(this._snapshots.forThreads(threadIds)).map((s) => s.text).filter(Boolean).slice(0, ContactProfiler.MAX_CONVERSATIONS);
    return { messages, conversations };
  }

  _from(notification, identities, known) {
    const who = ContactService.parse(notification.sender, notification.app);
    if (!who) return false;
    const same = identities.filter((identity) => identity.app === notification.app && identity.handle === who.handle);
    if (!same.length || who.isEmail) return same.length > 0;
    const contextId = this._contextOf(notification, known);
    return same.some((identity) => (identity.contextId || null) === contextId);
  }

  _contextOf(notification, known) {
    if (!this._contexts) return null;
    const { url, partition, host, sender, app } = notification;
    return this._contexts.resolve({ url, partition, host, sender, app }, known) || null;
  }

  async _ask(contact, material) {
    const reply = await this._llm.sendCompletion(ContactProfiler.SLOT, ContactProfilePrompt.messages(contact, material), {
      temperature: 0.1, max_tokens: ContactProfiler.MAX_TOKENS, label: `Hub contact: ${contact.name}`,
    });
    if (!reply || reply.success === false) throw new Error((reply && reply.error) || 'The model did not answer.');
    const proposals = ContactProfilePrompt.parse(ResponseText.extract(reply.response));
    if (!proposals) throw new Error('The model did not answer in the expected form.');
    return proposals;
  }
}

module.exports = ContactProfiler;
