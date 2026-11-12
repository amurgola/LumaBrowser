class ProfileOptions {
  static DEFAULT_LABEL = 'run';
  static LABEL_PATTERN = /^[a-zA-Z0-9_-]+$/;

  static parse(argv = []) {
    const label = argv[0] && !argv[0].startsWith('--') ? argv[0] : ProfileOptions.DEFAULT_LABEL;
    if (!ProfileOptions.LABEL_PATTERN.test(label)) throw new Error('Label must be alphanumeric');
    return {
      label,
      firstRun: argv.includes('--first-run'),
      noAdblock: argv.includes('--no-adblock'),
    };
  }
}

module.exports = ProfileOptions;
