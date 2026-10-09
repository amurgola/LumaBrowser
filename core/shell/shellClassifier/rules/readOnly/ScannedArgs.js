class ScannedArgs {
  constructor() {
    this.options = [];
    this.operands = [];
  }

  addOption(form, name, value, spelling) {
    this.options.push({ form, name, value, spelling });
  }

  addOperand(word) {
    this.operands.push(word);
  }

  valuesOf(short, long) {
    return this.options.filter((option) => ScannedArgs._isOption(option, short, long)).map((option) => option.value);
  }

  hasOption(short, long) {
    return this.options.some((option) => ScannedArgs._isOption(option, short, long));
  }

  static _isOption(option, short, long) {
    return (option.form === 'short' && option.name === short) || (option.form === 'long' && option.name === long);
  }
}

module.exports = ScannedArgs;
