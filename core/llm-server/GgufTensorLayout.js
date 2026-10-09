class GgufTensorLayout {
  static MAX_TENSOR_COUNT = 1000 * 1000;
  static DEFAULT_ALIGNMENT = 32;

  static EXPERT_TENSOR = /^ffn_(gate|up|down)_exps\./;
  static HOST_INPUT_TENSOR = /^(token_embd|per_layer_token_embd)\./;
  static BLOCK_TENSOR = /^blk\.(\d+)\.(.+)$/;

  static isPlausibleTensorCount(tensorCount) {
    return Number.isFinite(tensorCount) && tensorCount >= 0 && tensorCount <= GgufTensorLayout.MAX_TENSOR_COUNT;
  }

  static dataSectionStart(headerEnd, alignment) {
    const align = alignment > 0 ? alignment : GgufTensorLayout.DEFAULT_ALIGNMENT;
    return Math.ceil(headerEnd / align) * align;
  }

  static scan(entries, dataBytes) {
    const sorted = [...entries].sort((a, b) => a.offset - b.offset);
    const scan = GgufTensorLayout._emptyScan();
    const blocksSeen = new Set();
    const kvBlocks = new Set();
    sorted.forEach((entry, i) => {
      const end = i + 1 < sorted.length ? sorted[i + 1].offset : dataBytes;
      const bytes = Math.max(0, end - entry.offset);
      GgufTensorLayout._classifyTensor(scan, blocksSeen, kvBlocks, entry.name, bytes);
    });
    scan.blocks = GgufTensorLayout._sortedNumbers(blocksSeen);
    scan.kvBlocks = GgufTensorLayout._sortedNumbers(kvBlocks);
    scan.dataBytes = dataBytes;
    scan.tensorCount = entries.length;
    return scan;
  }

  static merge(scans) {
    if (!Array.isArray(scans) || !scans.length || scans.some((s) => !s)) return null;
    const merged = GgufTensorLayout._emptyScan();
    const blocks = new Set();
    const kvBlocks = new Set();
    for (const s of scans) GgufTensorLayout._addScan(merged, blocks, kvBlocks, s);
    merged.blocks = GgufTensorLayout._sortedNumbers(blocks);
    merged.kvBlocks = GgufTensorLayout._sortedNumbers(kvBlocks);
    return merged;
  }

  static derive(scan, blockCount) {
    const out = { attnKvPerLayer: null, attnKvLayerCount: null, mtpGrafted: null, tensorLayout: null, error: null };
    if (!scan) return out;
    const seen = new Set((scan.blocks || []).map(Number));
    if (seen.size > 0) out.mtpGrafted = (Number(scan.mtpTensors) || 0) > 0;
    const blocks = Number(blockCount) || 0;
    if (!blocks) return out;
    if (!GgufTensorLayout._coversEveryBlock(seen, blocks)) {
      out.error = `tensor scan saw ${seen.size}/${blocks} blocks (multi-file shard?)`;
      return out;
    }
    GgufTensorLayout._fillKvVerdict(out, scan, blocks);
    out.tensorLayout = GgufTensorLayout._buildByteLayout(scan, blocks);
    return out;
  }

  static _emptyScan() {
    return {
      blocks: [], kvBlocks: [], mtpTensors: 0,
      expertBytesByBlock: Object.create(null), residentBytesByBlock: Object.create(null),
      hostBytes: 0, otherBytes: 0, dataBytes: 0, tensorCount: 0,
    };
  }

  static _classifyTensor(scan, blocksSeen, kvBlocks, name, bytes) {
    const match = GgufTensorLayout.BLOCK_TENSOR.exec(name);
    if (!match) {
      if (GgufTensorLayout.HOST_INPUT_TENSOR.test(name)) scan.hostBytes += bytes;
      else scan.otherBytes += bytes;
      return;
    }
    const block = Number(match[1]);
    const rest = match[2];
    blocksSeen.add(block);
    if (rest.startsWith('attn_k.')) kvBlocks.add(block);
    if (rest.startsWith('nextn.')) scan.mtpTensors++;
    const target = GgufTensorLayout.EXPERT_TENSOR.test(rest) ? scan.expertBytesByBlock : scan.residentBytesByBlock;
    target[block] = (target[block] || 0) + bytes;
  }

  static _addScan(merged, blocks, kvBlocks, scan) {
    for (const b of scan.blocks || []) blocks.add(Number(b));
    for (const b of scan.kvBlocks || []) kvBlocks.add(Number(b));
    merged.mtpTensors += Number(scan.mtpTensors) || 0;
    GgufTensorLayout._sumInto(merged.expertBytesByBlock, scan.expertBytesByBlock);
    GgufTensorLayout._sumInto(merged.residentBytesByBlock, scan.residentBytesByBlock);
    merged.hostBytes += Number(scan.hostBytes) || 0;
    merged.otherBytes += Number(scan.otherBytes) || 0;
    merged.dataBytes += Number(scan.dataBytes) || 0;
    merged.tensorCount += Number(scan.tensorCount) || 0;
  }

  static _sumInto(target, source) {
    for (const [key, value] of Object.entries(source || {})) {
      target[key] = (target[key] || 0) + (Number(value) || 0);
    }
  }

  static _coversEveryBlock(seen, blocks) {
    for (let i = 0; i < blocks; i++) if (!seen.has(i)) return false;
    return true;
  }

  static _fillKvVerdict(out, scan, blocks) {
    const kv = new Set((scan.kvBlocks || []).map(Number));
    out.attnKvPerLayer = Array.from({ length: blocks }, (_, i) => kv.has(i));
    out.attnKvLayerCount = out.attnKvPerLayer.filter(Boolean).length;
  }

  static _buildByteLayout(scan, blocks) {
    return {
      expertBytesPerBlock: GgufTensorLayout._perBlock(scan.expertBytesByBlock, blocks),
      residentBytesPerBlock: GgufTensorLayout._perBlock(scan.residentBytesByBlock, blocks),
      hostBytes: Number(scan.hostBytes) || 0,
      otherBytes: Number(scan.otherBytes) || 0,
      totalBytes: Number(scan.dataBytes) || 0,
    };
  }

  static _perBlock(bytesByBlock, blocks) {
    return Array.from({ length: blocks }, (_, i) => Number((bytesByBlock || {})[i]) || 0);
  }

  static _sortedNumbers(set) {
    return Array.from(set).sort((a, b) => a - b);
  }
}

module.exports = GgufTensorLayout;
