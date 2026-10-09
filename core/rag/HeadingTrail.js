class HeadingTrail {
  constructor() {
    this._stack = [];
  }

  enter(level, title) {
    while (this._stack.length && this._stack[this._stack.length - 1].level >= level) this._stack.pop();
    const parents = this.titles();
    if (title) this._stack.push({ level, title });
    return parents;
  }

  titles() {
    return this._stack.map((heading) => heading.title);
  }
}

module.exports = HeadingTrail;
