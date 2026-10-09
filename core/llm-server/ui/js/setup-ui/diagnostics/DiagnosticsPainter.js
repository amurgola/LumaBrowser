import BudgetCard from './BudgetCard.js';
import CpuCard from './CpuCard.js';
import CudaCard from './CudaCard.js';
import DiskCard from './DiskCard.js';
import GpuCard from './GpuCard.js';
import MemoryCard from './MemoryCard.js';

export default class DiagnosticsPainter {
  static paint(doc, d) {
    doc.getElementById('hostMeta').textContent = DiagnosticsPainter.hostLine(d.platform);
    MemoryCard.render(doc, d.memory);
    CpuCard.render(doc, d.cpu);
    GpuCard.render(doc, d.gpu);
    CudaCard.render(doc, d.cuda);
    DiskCard.render(doc, d.disks);
    BudgetCard.render(doc, d.budget || { ram: {}, vram: {} });
  }

  static hostLine(platform) {
    return `${platform.os} ${platform.arch} · kernel ${platform.release} · ${platform.hostname}`;
  }
}
