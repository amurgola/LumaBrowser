#!/usr/bin/env python
"""decode-minidump: read a Crashpad .dmp without a debugger.

Prints the exception (code, faulting address, thread), the module the fault
address falls in with its offset (comparable to the "Fault offset" in the
Windows Application-Error event), a poor-man's stack walk of the crashing
thread (every stack slot that points into a loaded module, innermost first),
and the Crashpad annotations CrashTracer attached (last_mark, run_log).

    python scripts/decode-minidump.py <file.dmp> [--slots 60]

Requires: pip install minidump
"""
import re
import struct
import sys
from pathlib import Path

try:
    from minidump.minidumpfile import MinidumpFile
except ImportError:  # pragma: no cover
    sys.exit("pip install minidump")

EXC_NAMES = {
    0xC0000005: "STATUS_ACCESS_VIOLATION",
    0xC000001D: "STATUS_ILLEGAL_INSTRUCTION",
    0xC0000409: "STATUS_STACK_BUFFER_OVERRUN (fastfail / __fastfail)",
    0xC000041D: "STATUS_FATAL_USER_CALLBACK_EXCEPTION (exception escaped a Win32 callback)",
    0x80000003: "STATUS_BREAKPOINT",
    0xC00000FD: "STATUS_STACK_OVERFLOW",
    0xE0000008: "OOM / abort (Chromium)",
}


def module_for(modules, addr):
    for m in modules:
        if m.baseaddress <= addr < m.baseaddress + m.size:
            return m
    return None


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    path = Path(sys.argv[1])
    slots = 60
    if "--slots" in sys.argv:
        slots = int(sys.argv[sys.argv.index("--slots") + 1])

    md = MinidumpFile.parse(str(path))
    modules = sorted(md.modules.modules, key=lambda m: m.baseaddress) if md.modules else []

    print(f"dump: {path}")
    if md.sysinfo:
        print(f"system: {md.sysinfo.ProcessorArchitecture} {md.sysinfo.MajorVersion}.{md.sysinfo.MinorVersion}.{md.sysinfo.BuildNumber}")

    exc = md.exception.exception_records[0] if md.exception and md.exception.exception_records else None
    if not exc:
        print("no exception stream (not a crash dump?)")
    else:
        rec = exc.ExceptionRecord
        code = rec.ExceptionCode
        code = int(code.value) if hasattr(code, 'value') else int(code)
        addr = rec.ExceptionAddress
        print(f"exception: 0x{code:08X} {EXC_NAMES.get(code, '')}")
        main_tid = md.threads.threads[0].ThreadId if md.threads and md.threads.threads else None
        print(f"  thread id: {exc.ThreadId}{' (first thread in dump = main/UI thread)' if exc.ThreadId == main_tid else ''}")
        print(f"  address:   0x{addr:016X}")
        m = module_for(modules, addr)
        if m:
            print(f"  module:    {Path(m.name).name}  base=0x{m.baseaddress:X}  offset=0x{addr - m.baseaddress:X}")
        params = list(getattr(rec, 'ExceptionInformation', []) or [])
        if params:
            print(f"  params:    {[hex(p) for p in params]}")
        if code == 0xC000041D and params:
            print("  note: fatal-user-callback wraps an inner exception; the stack walk below shows where it was raised")

        thread = None
        if md.threads:
            for t in md.threads.threads:
                if t.ThreadId == exc.ThreadId:
                    thread = t
                    break
        if thread is not None and md.memory_segments_64 or md.memory_segments:
            stack_start = thread.Stack.StartOfMemoryRange
            stack_size = thread.Stack.DataSize
            rsp = None
            try:
                from minidump.streams.ContextStream import CONTEXT
                import io
                raw_ctx = path.read_bytes()[exc.ThreadContext.Rva: exc.ThreadContext.Rva + exc.ThreadContext.DataSize]
                ctx = CONTEXT.parse(io.BytesIO(raw_ctx))
                rsp = ctx.Rsp
                print(f"  at fault:  rip=0x{ctx.Rip:X} rsp=0x{ctx.Rsp:X} rbp=0x{ctx.Rbp:X} rax=0x{ctx.Rax:X} rcx=0x{ctx.Rcx:X} rdx=0x{ctx.Rdx:X} r8=0x{ctx.R8:X} r9=0x{ctx.R9:X}")
            except Exception as e:  # pragma: no cover
                print(f"  (no exception context: {e})")
            try:
                data = path.read_bytes()[thread.Stack.MemoryLocation.Rva: thread.Stack.MemoryLocation.Rva + stack_size]
                if rsp and stack_start <= rsp < stack_start + stack_size:
                    data = data[rsp - stack_start:]
                    print(f"  (walk starts at the faulting rsp, {len(data)} bytes to the stack top)")
            except Exception as e:  # pragma: no cover
                data = b""
                print(f"  (could not read stack memory: {e})")
            print(f"\nstack walk (thread {exc.ThreadId}, {stack_size} bytes, innermost first):")
            found = 0
            for off in range(0, len(data) - 7, 8):
                ptr = struct.unpack_from("<Q", data, off)[0]
                m = module_for(modules, ptr)
                if not m:
                    continue
                print(f"  sp+0x{off:05X}  {Path(m.name).name}+0x{ptr - m.baseaddress:X}")
                found += 1
                if found >= slots:
                    print("  ...")
                    break

    raw = path.read_bytes()
    print("\nannotations:")
    for key in (b"last_mark", b"run_log", b"_productName", b"_version", b"process_type"):
        for match in re.finditer(re.escape(key), raw):
            window = raw[match.end(): match.end() + 200]
            text = re.sub(rb"[^\x20-\x7e]+", b" ", window).decode("ascii", "replace").strip()
            print(f"  {key.decode()}: {text[:160]}")
            break

    print("\nmodules (first 12):")
    for m in modules[:12]:
        print(f"  0x{m.baseaddress:016X} +0x{m.size:X}  {Path(m.name).name}")


if __name__ == "__main__":
    main()
