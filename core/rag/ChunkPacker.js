class ChunkPacker {
  constructor(budget) {
    this._budget = budget;
  }

  pack(groups) {
    this._windows = [];
    this._open = [];
    this._carried = 0;
    for (const group of groups) this._place(group);
    this._seal(false);
    return this._windows;
  }

  _place(group) {
    if (group.opensSection && this._fill() >= this._budget.sectionFloorChars) this._seal(false);
    if (this._admits(group.start, group.end)) return this._take(group.units);
    if (this._shouldMoveWhole(group)) return this._moveWhole(group);
    for (const unit of group.units) this._placeUnit(unit);
  }

  _shouldMoveWhole(group) {
    return this._budget.fits(group.end - group.start) && this._fill() >= this._budget.sectionFloorChars;
  }

  _moveWhole(group) {
    this._seal(!group.opensSection);
    this._makeRoomFor(group.start, group.end);
    this._take(group.units);
  }

  _placeUnit(unit) {
    if (!this._admits(unit.start, unit.end)) {
      this._seal(!unit.heading);
      this._makeRoomFor(unit.start, unit.end);
    }
    this._take([unit]);
  }

  _seal(withCarry) {
    const holdsNew = this._open.length > this._carried;
    if (holdsNew) this._windows.push(this._open);
    const carry = !withCarry ? [] : (holdsNew ? this._carryFrom(this._open) : this._open);
    this._open = carry;
    this._carried = carry.length;
  }

  _makeRoomFor(start, end) {
    if (!this._admits(start, end)) {
      this._open = [];
      this._carried = 0;
    }
  }

  _carryFrom(units) {
    if (!this._budget.carryChars || units.length < 2) return [];
    const end = units[units.length - 1].end;
    let first = units.length;
    while (first > 1 && ChunkPacker._carryable(units[first - 1], end, this._budget.carryChars)) first--;
    return units.slice(first);
  }

  static _carryable(unit, end, carryChars) {
    return !unit.heading && end - unit.start <= carryChars;
  }

  _take(units) {
    this._open.push(...units);
  }

  _admits(start, end) {
    const from = this._open.length ? this._open[0].start : start;
    return this._budget.fits(end - from);
  }

  _fill() {
    return this._open.length ? this._open[this._open.length - 1].end - this._open[0].start : 0;
  }
}

module.exports = ChunkPacker;
