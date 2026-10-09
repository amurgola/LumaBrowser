class ThemePalettes {
  static PALETTES = {
    dark: {
      accent: '#f59034',
      accentDeep: '#e07d22',
      text: '#e6e9f2',
      dim: '#8a95ad',
      muted: '#76819b',
      good: '#4ade80',
      warn: '#fbbf24',
      bad: '#f87171',
      info: '#7aa2f7',
      border: '#3a4257',
      codeBg: '#161a23',
      panelBg: '#141b2c',
      selectedBg: '#2a3142',
      diffAdd: '#4ade80',
      diffDel: '#f87171',
      diffCtx: '#76819b',
    },
    light: {
      accent: '#d8731a',
      accentDeep: '#b85f10',
      text: '#1f2430',
      dim: '#5b6478',
      muted: '#6e7789',
      good: '#1a7f37',
      warn: '#9a6700',
      bad: '#cf222e',
      info: '#2f5fd0',
      border: '#c6ccd8',
      codeBg: '#f2f4f8',
      panelBg: '#eef1f6',
      selectedBg: '#dfe5ef',
      diffAdd: '#1a7f37',
      diffDel: '#cf222e',
      diffCtx: '#6e7789',
    },
  };

  static BASIC = {
    accent: 33, accentDeep: 33, text: 39, dim: 90, muted: 90, good: 32, warn: 33, bad: 31, info: 34,
    border: 90, codeBg: 0, panelBg: 0, selectedBg: 0, diffAdd: 32, diffDel: 31, diffCtx: 90,
  };

  static GLYPHS = {
    unicode: {
      bar: '┃', barEnd: '╹', prompt: '❯', spinner: ['◇', '◈', '◆', '◈'],
      ok: '✓', fail: '✗', running: '●', pending: '○', done: '▣', approval: '△', artifact: '◆', agent: '◇',
      bullet: '•', rule: '─', ellipsis: '…', arrowR: '→', arrowL: '←', shell: '$', search: '✱', web: '◈',
      corner: '╰', tee: '├', vline: '│', dot: '·',
    },
    ascii: {
      bar: '|', barEnd: '\'', prompt: '>', spinner: ['-', '\\', '|', '/'],
      ok: 'ok', fail: 'x', running: '*', pending: 'o', done: '#', approval: '!', artifact: '+', agent: '@',
      bullet: '*', rule: '-', ellipsis: '...', arrowR: '->', arrowL: '<-', shell: '$', search: '*', web: '@',
      corner: '`', tee: '|', vline: '|', dot: '.',
    },
  };
}

module.exports = ThemePalettes;
