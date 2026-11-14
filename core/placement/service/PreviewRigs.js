const ResourceBudget = require('../../llm-server/diagnostics/ResourceBudget');

const GB = 1024 * 1024 * 1024;
const MIB_PER_GB = 1024;

class PreviewRigs {
  static RIGS = [
    { id: '8gb-16', label: '8 GB card, 16 GB RAM', card: { name: 'NVIDIA GeForce RTX 4060', totalGB: 8 }, ramGB: 16 },
    { id: '8gb-32', label: '8 GB card, 32 GB RAM', card: { name: 'NVIDIA GeForce RTX 4060', totalGB: 8 }, ramGB: 32 },
    { id: '8gb-64', label: '8 GB card, 64 GB RAM', card: { name: 'NVIDIA GeForce RTX 4060', totalGB: 8 }, ramGB: 64 },
    { id: '16gb-32', label: '16 GB card, 32 GB RAM', card: { name: 'NVIDIA GeForce RTX 4060 Ti', totalGB: 16 }, ramGB: 32 },
    { id: '24gb-64', label: '24 GB card, 64 GB RAM', card: { name: 'NVIDIA GeForce RTX 3090', totalGB: 24 }, ramGB: 64 },
  ];

  static list() {
    return PreviewRigs.RIGS.map((rig) => ({ id: rig.id, label: rig.label }));
  }

  static byId(id) {
    return PreviewRigs.RIGS.find((rig) => rig.id === id) || null;
  }

  static diagnostics(rig) {
    const cuda = {
      available: true,
      devices: [{ name: rig.card.name, memoryTotalMB: rig.card.totalGB * MIB_PER_GB, memoryFreeMB: rig.card.totalGB * MIB_PER_GB }],
    };
    const memory = { totalBytes: rig.ramGB * GB, freeBytes: rig.ramGB * GB };
    return { cuda, memory, budget: ResourceBudget.compute(memory, null, cuda) };
  }
}

module.exports = PreviewRigs;
