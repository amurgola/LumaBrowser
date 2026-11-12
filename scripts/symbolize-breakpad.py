#!/usr/bin/env python
"""symbolize-breakpad: map module offsets to function names + source lines
using a breakpad .sym file (Electron ships them in the *-symbols.zip release
asset: breakpad_symbols/electron.exe.pdb/<id>/electron.exe.sym).

    python scripts/symbolize-breakpad.py <file.sym> 0x4B37F38 0x2411670 ...
"""
import bisect, sys

def load(path):
    files, funcs = {}, []   # funcs: (addr, size, name, [(addr, size, line, file)])
    cur = None
    with open(path, encoding='utf-8', errors='replace') as f:
        for line in f:
            if line.startswith('FILE '):
                _, num, fname = line.rstrip('\n').split(' ', 2)
                files[int(num)] = fname
            elif line.startswith('FUNC '):
                parts = line.rstrip('\n').split(' ')
                i = 1
                if parts[1] == 'm': i = 2
                addr, size = int(parts[i], 16), int(parts[i + 1], 16)
                name = ' '.join(parts[i + 3:])
                cur = [addr, size, name, []]
                funcs.append(cur)
            elif line[0] in '0123456789abcdef' and cur is not None:
                p = line.split()
                if len(p) == 4:
                    cur[3].append((int(p[0], 16), int(p[1], 16), int(p[2]), int(p[3])))
            elif line.startswith('PUBLIC '):
                parts = line.rstrip('\n').split(' ')
                i = 1
                if parts[1] == 'm': i = 2
                funcs.append([int(parts[i], 16), 0, ' '.join(parts[i + 2:]), []])
    funcs.sort(key=lambda x: x[0])
    return files, funcs, [x[0] for x in funcs]

def lookup(files, funcs, addrs, off):
    i = bisect.bisect_right(addrs, off) - 1
    if i < 0: return f'0x{off:X} ?'
    addr, size, name, lines = funcs[i]
    if size and off >= addr + size:
        return f'0x{off:X} {name}+0x{off - addr:X} (past end)'
    loc = ''
    for la, ls, ln, lf in lines:
        if la <= off < la + ls:
            loc = f'  [{files.get(lf, "?")}:{ln}]'
            break
    return f'0x{off:X} {name}+0x{off - addr:X}{loc}'

if __name__ == '__main__':
    files, funcs, addrs = load(sys.argv[1])
    for a in sys.argv[2:]:
        print(lookup(files, funcs, addrs, int(a, 16)))
