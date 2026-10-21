class ChromeStoreCatalog {
  static WORKS = 'works';
  static PARTIAL = 'partial';

  static CATEGORIES = Object.freeze({
    passwords: 'Passwords & security',
    appearance: 'Appearance',
    media: 'Video & media',
    productivity: 'Productivity',
    developer: 'Developer tools',
  });

  static ENTRIES = Object.freeze([
    {
      id: 'nngceckbapebfimnlniiiahkandclblb',
      name: 'Bitwarden Password Manager',
      category: 'passwords',
      description: 'Open-source password manager with cloud sync.',
      compatibility: ChromeStoreCatalog.WORKS,
      notes: 'Unlock and manage the vault with "Open"; autofill runs from the in-page menu and the right-click menu.',
    },
    {
      id: 'ghmbeldphafepmbegfdlkpapadhbakde',
      name: 'Proton Pass',
      category: 'passwords',
      description: 'End-to-end encrypted password manager and email aliases from Proton.',
      compatibility: ChromeStoreCatalog.PARTIAL,
      notes: 'Sign in with "Open". Autofill works; passkey prompts are not available in Electron.',
    },
    {
      id: 'bhghoamapcdpbohphigoooaddinpkbai',
      name: 'Authenticator',
      category: 'passwords',
      description: 'Two-factor TOTP codes, kept locally and optionally encrypted.',
      compatibility: ChromeStoreCatalog.WORKS,
      notes: 'Codes live in the "Open" window. QR scanning from the page is unavailable; add accounts manually.',
    },
    {
      id: 'eimadpbcbfnmbkopoojfekhnkhdbieeh',
      name: 'Dark Reader',
      category: 'appearance',
      description: 'Dark mode for every website, tuned per site.',
      compatibility: ChromeStoreCatalog.WORKS,
      notes: 'Adjust brightness, contrast and site lists from "Open".',
    },
    {
      id: 'clngdbkpkpeebahjckkjfobafhncgmne',
      name: 'Stylus',
      category: 'appearance',
      description: 'Restyle sites with your own or community user styles.',
      compatibility: ChromeStoreCatalog.WORKS,
      notes: 'Write and manage styles from "Options".',
    },
    {
      id: 'gebbhagfogifgggkldgodflihgfeippi',
      name: 'Return YouTube Dislike',
      category: 'media',
      description: 'Shows dislike counts on YouTube again.',
      compatibility: ChromeStoreCatalog.WORKS,
      notes: 'Runs entirely in the page; nothing to configure.',
    },
    {
      id: 'mnjggcdmjocbbbhaepdhchncahnbgone',
      name: 'SponsorBlock for YouTube',
      category: 'media',
      description: 'Skips sponsor segments, intros and reminders in YouTube videos.',
      compatibility: ChromeStoreCatalog.WORKS,
      notes: 'Skipping works in the player; segment settings are under "Options".',
    },
    {
      id: 'nffaoalbilbmmfgbnbgppjihopabppdk',
      name: 'Video Speed Controller',
      category: 'media',
      description: 'Keyboard shortcuts to speed up, slow down and rewind any HTML5 video.',
      compatibility: ChromeStoreCatalog.WORKS,
      notes: 'Use the on-video controller or S / D / R hotkeys.',
    },
    {
      id: 'khncfooichmfjbepaaaebmommgaepoid',
      name: 'Unhook',
      category: 'media',
      description: 'Hides YouTube recommendations, Shorts and other distractions.',
      compatibility: ChromeStoreCatalog.WORKS,
      notes: 'Pick what to hide from "Open".',
    },
    {
      id: 'dbepggeogbaibhgnhhndojpepiihcmeb',
      name: 'Vimium',
      category: 'productivity',
      description: 'Vim-style keyboard navigation for the web.',
      compatibility: ChromeStoreCatalog.PARTIAL,
      notes: 'Link hints, scrolling and find work. Tab commands (J, K, x) depend on chrome.tabs calls Electron lacks.',
    },
    {
      id: 'bcjindcccaagfpapjjmafapmmgkkhgoa',
      name: 'JSON Formatter',
      category: 'productivity',
      description: 'Pretty-prints and collapses raw JSON responses.',
      compatibility: ChromeStoreCatalog.WORKS,
      notes: 'Open any JSON URL in a tab.',
    },
    {
      id: 'fmkadmapgofadopljbjfkapdkoienihi',
      name: 'React Developer Tools',
      category: 'developer',
      description: 'Components and Profiler panels for React apps.',
      compatibility: ChromeStoreCatalog.WORKS,
      notes: 'Panels appear in the tab\'s DevTools (F12) after a reload.',
    },
    {
      id: 'nhdogjmejiglipccpnnnanhbledajbpd',
      name: 'Vue.js devtools',
      category: 'developer',
      description: 'Inspect Vue components, state and events.',
      compatibility: ChromeStoreCatalog.PARTIAL,
      notes: 'The DevTools panel works; the toolbar detection badge does not show.',
    },
    {
      id: 'lmhkpmbekcpmknklioeibfkpmmfibljd',
      name: 'Redux DevTools',
      category: 'developer',
      description: 'Time-travel debugging for Redux and similar state containers.',
      compatibility: ChromeStoreCatalog.WORKS,
      notes: 'Use the Redux panel in the tab\'s DevTools (F12).',
    },
    {
      id: 'gppongmhjkpfnbhagpmjfkannfbllamg',
      name: 'Wappalyzer',
      category: 'developer',
      description: 'Identifies the frameworks, CMS and services a site is built with.',
      compatibility: ChromeStoreCatalog.PARTIAL,
      notes: 'Detection runs per page; results open with "Open" for the active tab.',
    },
  ]);

  static list() {
    return ChromeStoreCatalog.ENTRIES.map((entry) => ({
      ...entry,
      categoryLabel: ChromeStoreCatalog.CATEGORIES[entry.category] || entry.category,
    }));
  }

  static get(id) {
    return ChromeStoreCatalog.list().find((entry) => entry.id === id) || null;
  }
}

module.exports = ChromeStoreCatalog;
