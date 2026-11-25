const fs = require('fs');
const SafetensorsHeader = require('../SafetensorsHeader');
const Int8ConvrotPlan = require('./Int8ConvrotPlan');
const Int8ConvrotWorkers = require('./Int8ConvrotWorkers');

class Int8ConvrotConverter {
  static COPY_CHUNK_BYTES = 8 * 1024 * 1024;
  static PARTIAL_SUFFIX = '.partial';

  static async convert({ sourcePath, outputPath, layerPattern, onProgress = () => {}, signal = null, workers = null }) {
    const source = SafetensorsHeader.readFile(sourcePath);
    const plan = Int8ConvrotPlan.build(source.json, layerPattern);
    if (!plan.layers) throw new Error('This model has no layers that can be stored as INT8.');
    const pool = workers || new Int8ConvrotWorkers();
    const partialPath = outputPath + Int8ConvrotConverter.PARTIAL_SUFFIX;
    try {
      const bytes = await Int8ConvrotConverter._write({ sourcePath, source, plan, partialPath, pool, onProgress, signal });
      await fs.promises.rename(partialPath, outputPath);
      return { outputPath, layers: plan.layers, bytes };
    } catch (error) {
      await fs.promises.rm(partialPath, { force: true });
      throw error;
    } finally {
      pool.close();
    }
  }

  static async _write({ sourcePath, source, plan, partialPath, pool, onProgress, signal }) {
    const header = SafetensorsHeader.encode(plan.header);
    const totalBytes = header.length + plan.dataBytes;
    const progress = { doneBytes: header.length, totalBytes };
    const input = await fs.promises.open(sourcePath, 'r');
    const output = await fs.promises.open(partialPath, 'w');
    try {
      await output.write(header, 0, header.length, 0);
      const context = { sourcePath, input, output, sourceStart: source.dataStart, targetStart: header.length, pool, signal };
      const report = (bytes) => {
        progress.doneBytes += bytes;
        onProgress({ ...progress });
      };
      await Promise.all([
        Int8ConvrotConverter._convertLayers(context, plan.entries.filter((entry) => entry.kind === 'layer'), report),
        Int8ConvrotConverter._copyThrough(context, plan.entries.filter((entry) => entry.kind !== 'layer'), report),
      ]);
    } finally {
      await input.close();
      await output.close();
    }
    return totalBytes;
  }

  static _convertLayers(context, layers, report) {
    return Promise.all(layers.map(async (layer) => {
      Int8ConvrotConverter._throwIfAborted(context.signal);
      const { codes, scales } = await context.pool.run({
        sourcePath: context.sourcePath,
        position: context.sourceStart + layer.sourceOffset,
        length: layer.length,
        dtype: layer.dtype,
        rows: layer.rows,
        columns: layer.columns,
      });
      Int8ConvrotConverter._throwIfAborted(context.signal);
      await Int8ConvrotConverter._writeAll(context.output, Buffer.from(codes.buffer), context.targetStart + layer.codesOffset);
      await Int8ConvrotConverter._writeAll(context.output, Buffer.from(scales.buffer), context.targetStart + layer.scalesOffset);
      report(codes.byteLength + scales.byteLength);
    }));
  }

  static async _copyThrough(context, entries, report) {
    for (const entry of entries) {
      Int8ConvrotConverter._throwIfAborted(context.signal);
      if (entry.kind === 'bytes') {
        await Int8ConvrotConverter._writeAll(context.output, entry.bytes, context.targetStart + entry.targetOffset);
        report(entry.bytes.length);
      } else {
        await Int8ConvrotConverter._copyRange(context, entry);
        report(entry.length);
      }
    }
  }

  static async _copyRange(context, entry) {
    const chunk = Buffer.allocUnsafe(Math.min(entry.length, Int8ConvrotConverter.COPY_CHUNK_BYTES));
    let done = 0;
    while (done < entry.length) {
      const wanted = Math.min(chunk.length, entry.length - done);
      const { bytesRead } = await context.input.read(chunk, 0, wanted, context.sourceStart + entry.sourceOffset + done);
      if (bytesRead <= 0) throw new Error('The model file ended before its tensors did.');
      await Int8ConvrotConverter._writeAll(context.output, chunk.subarray(0, bytesRead), context.targetStart + entry.targetOffset + done);
      done += bytesRead;
    }
  }

  static async _writeAll(output, bytes, position) {
    let done = 0;
    while (done < bytes.length) {
      const { bytesWritten } = await output.write(bytes, done, bytes.length - done, position + done);
      done += bytesWritten;
    }
  }

  static _throwIfAborted(signal) {
    if (signal && signal.aborted) throw new Error('The conversion was stopped.');
  }
}

module.exports = Int8ConvrotConverter;
