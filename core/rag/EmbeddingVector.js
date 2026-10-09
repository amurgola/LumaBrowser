class EmbeddingVector {
  static BYTES_PER_FLOAT = 4;

  static cosine(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  static pack(vector) {
    if (!Array.isArray(vector)) return null;
    const floats = new Float32Array(vector);
    return Buffer.from(floats.buffer, floats.byteOffset, floats.byteLength);
  }

  static unpack(buffer) {
    if (!buffer || !buffer.length) return null;
    const aligned = EmbeddingVector._aligned(buffer);
    const floats = new Float32Array(aligned.buffer, aligned.byteOffset, Math.floor(aligned.length / EmbeddingVector.BYTES_PER_FLOAT));
    return Array.from(floats);
  }

  static _aligned(buffer) {
    if (buffer.byteOffset % EmbeddingVector.BYTES_PER_FLOAT === 0) return buffer;
    return Buffer.from(buffer);
  }
}

module.exports = EmbeddingVector;
