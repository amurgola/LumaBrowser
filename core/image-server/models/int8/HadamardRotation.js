class HadamardRotation {
  static GROUP = 256;

  static rotateRows(values, rows, columns, group = HadamardRotation.GROUP) {
    HadamardRotation._requireGroups(columns, group);
    const scale = 1 / Math.sqrt(group);
    for (let start = 0; start < rows * columns; start += group) {
      HadamardRotation._rotateGroup(values, start, group, scale);
    }
    return values;
  }

  static supports(columns, group = HadamardRotation.GROUP) {
    let remainder = group;
    while (remainder > 1 && remainder % 4 === 0) remainder /= 4;
    return remainder === 1 && columns > 0 && columns % group === 0;
  }

  static _requireGroups(columns, group) {
    if (!HadamardRotation.supports(columns, group)) {
      throw new Error(`A row of ${columns} values cannot be rotated in groups of ${group}.`);
    }
  }

  static _rotateGroup(values, start, group, scale) {
    for (let i = start; i < start + group; i++) values[i] *= scale;
    for (let stride = 1; stride < group; stride *= 4) {
      for (let base = start; base < start + group; base += 4 * stride) {
        for (let i = base; i < base + stride; i++) {
          HadamardRotation._butterfly(values, i, stride);
        }
      }
    }
  }

  static _butterfly(values, i, stride) {
    const a = values[i];
    const b = values[i + stride];
    const c = values[i + 2 * stride];
    const d = values[i + 3 * stride];
    values[i] = a + b + c - d;
    values[i + stride] = a + b - c + d;
    values[i + 2 * stride] = a - b + c + d;
    values[i + 3 * stride] = -a + b + c + d;
  }
}

module.exports = HadamardRotation;
