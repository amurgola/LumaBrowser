const fs = require('fs');
const { parentPort } = require('worker_threads');
const Int8ConvrotLayer = require('./Int8ConvrotLayer');
const TensorFloats = require('./TensorFloats');

class Int8ConvrotWorker {
  static convert(task) {
    const bytes = Int8ConvrotWorker._read(task.sourcePath, task.position, task.length);
    const values = TensorFloats.decode(bytes, task.dtype);
    return Int8ConvrotLayer.quantize(values, task.rows, task.columns);
  }

  static listen(port) {
    port.on('message', ({ id, task }) => {
      try {
        const { codes, scales } = Int8ConvrotWorker.convert(task);
        port.postMessage({ id, codes: codes.buffer, scales: scales.buffer }, [codes.buffer, scales.buffer]);
      } catch (error) {
        port.postMessage({ id, error: error.message });
      }
    });
  }

  static _read(sourcePath, position, length) {
    const bytes = Buffer.allocUnsafe(length);
    const fd = fs.openSync(sourcePath, 'r');
    try {
      let done = 0;
      while (done < length) {
        const read = fs.readSync(fd, bytes, done, length - done, position + done);
        if (read <= 0) throw new Error('The model file ended before the layer did.');
        done += read;
      }
    } finally {
      fs.closeSync(fd);
    }
    return bytes;
  }
}

if (parentPort) Int8ConvrotWorker.listen(parentPort);

module.exports = Int8ConvrotWorker;
