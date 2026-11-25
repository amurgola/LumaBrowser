const HadamardRotation = require('./HadamardRotation');

class Int8ConvrotLayer {
  static LEVELS = 127;

  static quantize(values, rows, columns, group = HadamardRotation.GROUP) {
    HadamardRotation.rotateRows(values, rows, columns, group);
    const codes = new Int8Array(rows * columns);
    const scales = new Float32Array(rows);
    for (let row = 0; row < rows; row++) {
      scales[row] = Int8ConvrotLayer._quantizeRow(values, codes, row * columns, columns);
    }
    return { codes, scales };
  }

  static _quantizeRow(values, codes, start, columns) {
    let largest = 0;
    for (let i = start; i < start + columns; i++) {
      const magnitude = Math.abs(values[i]);
      if (magnitude > largest) largest = magnitude;
    }
    const scale = Math.fround(largest / Int8ConvrotLayer.LEVELS);
    if (!(scale > 0)) return 0;
    for (let i = start; i < start + columns; i++) {
      codes[i] = Math.max(-Int8ConvrotLayer.LEVELS, Math.min(Int8ConvrotLayer.LEVELS, Math.round(values[i] / scale)));
    }
    return scale;
  }
}

module.exports = Int8ConvrotLayer;
