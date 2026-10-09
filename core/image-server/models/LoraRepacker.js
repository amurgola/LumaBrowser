const fs = require('fs');
const path = require('path');
const SafetensorsHeader = require('./SafetensorsHeader');

class LoraRepacker {
  static FUSED_MLP_RE = /^transformer\.(transformer_blocks\.\d+\.img_mlp)\.(gate_layer|proj)\.lora_([AB])\.weight$/;
  static ALIAS_MARKER = '.img_mlp.gate_up.weight';
  static COPY_CHUNK = 8 * 1024 * 1024;

  static fusedMlpAlias(key) {
    const match = LoraRepacker.FUSED_MLP_RE.exec(key);
    if (!match) return null;
    const half = match[2] === 'gate_layer' ? 'gate_up.weight' : 'gate_up.weight.1';
    const side = match[3] === 'A' ? 'lora_down' : 'lora_up';
    return `lora.model.diffusion_model.${match[1]}.${half}.${side}`;
  }

  static needsFusedMlpAliases(headerOrKeys) {
    const keys = Array.isArray(headerOrKeys) ? headerOrKeys : SafetensorsHeader.tensorNames(headerOrKeys);
    if (keys.some((key) => key.includes(LoraRepacker.ALIAS_MARKER))) return false;
    return keys.some((key) => LoraRepacker.FUSED_MLP_RE.test(key));
  }

  static repackFusedMlpAliases(srcPath, destPath) {
    const srcFd = fs.openSync(srcPath, 'r');
    try {
      const { json, dataStart } = SafetensorsHeader.read(srcFd);
      const entries = SafetensorsHeader.tensorNames(json).map((name) => [name, json[name]]);
      if (!LoraRepacker.needsFusedMlpAliases(entries.map(([name]) => name))) {
        return { repacked: false, tensors: entries.length, aliases: 0 };
      }
      const layout = LoraRepacker._layOut(entries, dataStart, json[SafetensorsHeader.METADATA_KEY]);
      LoraRepacker._writeFile(srcFd, destPath, layout);
      return { repacked: true, tensors: entries.length, aliases: layout.aliases };
    } finally {
      try { fs.closeSync(srcFd); } catch (_) {}
    }
  }

  static repackInPlaceIfNeeded(filePath) {
    const tmp = `${filePath}.repack-${process.pid}.tmp`;
    try {
      const result = LoraRepacker.repackFusedMlpAliases(filePath, tmp);
      if (!result.repacked) return { repacked: false };
      fs.renameSync(tmp, filePath);
      return { repacked: true, aliases: result.aliases };
    } catch (err) {
      try { fs.rmSync(tmp, { force: true }); } catch (_) {}
      return { repacked: false, error: err && err.message };
    }
  }

  static _layOut(entries, dataStart, metadata) {
    const header = {};
    const copies = [];
    let offset = 0;
    const place = (name, info) => {
      const [start, end] = info.data_offsets;
      const length = end - start;
      header[name] = { dtype: info.dtype, shape: info.shape, data_offsets: [offset, offset + length] };
      copies.push({ srcOff: dataStart + start, len: length, dstOff: offset });
      offset += length;
    };
    for (const [name, info] of entries) place(name, info);
    let aliases = 0;
    for (const [name, info] of entries) {
      const alias = LoraRepacker.fusedMlpAlias(name);
      if (!alias || header[alias]) continue;
      place(alias, info);
      aliases++;
    }
    if (metadata && typeof metadata === 'object') header[SafetensorsHeader.METADATA_KEY] = metadata;
    return { header, copies, aliases };
  }

  static _writeFile(srcFd, destPath, layout) {
    const headerBytes = SafetensorsHeader.encode(layout.header);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    const dstFd = fs.openSync(destPath, 'w');
    try {
      fs.writeSync(dstFd, headerBytes, 0, headerBytes.length, 0);
      for (const copy of layout.copies) {
        LoraRepacker._copyRange(srcFd, copy.srcOff, dstFd, headerBytes.length + copy.dstOff, copy.len);
      }
    } finally {
      fs.closeSync(dstFd);
    }
  }

  static _copyRange(srcFd, srcPos, dstFd, dstPos, bytes) {
    const buf = Buffer.alloc(Math.min(LoraRepacker.COPY_CHUNK, Math.max(bytes, 1)));
    let done = 0;
    while (done < bytes) {
      const n = fs.readSync(srcFd, buf, 0, Math.min(buf.length, bytes - done), srcPos + done);
      if (n <= 0) throw new Error('Unexpected end of file while copying tensor data.');
      fs.writeSync(dstFd, buf, 0, n, dstPos + done);
      done += n;
    }
  }
}

module.exports = LoraRepacker;
