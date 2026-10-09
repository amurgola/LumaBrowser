import ExtIcons from './ExtIcons.js';

export default class SavedBadge {
  static VISIBLE_MS = 1600;

  static flash(anchor, text) {
    if (!anchor) return;
    const badge = SavedBadge._badgeAfter(anchor);
    badge.querySelector('span').textContent = text || 'Saved';
    badge.classList.add('is-on');
    clearTimeout(badge._t);
    badge._t = setTimeout(() => badge.classList.remove('is-on'), SavedBadge.VISIBLE_MS);
  }

  static _badgeAfter(anchor) {
    const existing = anchor.nextElementSibling;
    if (existing && existing.classList && existing.classList.contains('luma-saved')) return existing;
    const badge = document.createElement('span');
    badge.className = 'luma-saved';
    badge.innerHTML = ExtIcons.CHECK + '<span></span>';
    anchor.insertAdjacentElement('afterend', badge);
    return badge;
  }
}
