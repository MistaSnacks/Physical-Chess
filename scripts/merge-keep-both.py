# Resolve git conflict markers by keeping both sides (ours then theirs).
# Used for append-only files like theme.css during WP merges.
import sys, re
for p in sys.argv[1:]:
    s = open(p).read()
    out, i = [], 0
    pat = re.compile(r'<<<<<<< [^\n]*\n(.*?)\n?=======\n(.*?)>>>>>>> [^\n]*\n', re.S)
    s2, n = pat.subn(lambda m: m.group(1) + ('\n' if not m.group(1).endswith('\n') else '') + m.group(2), s)
    open(p, 'w').write(s2)
    print(p, 'resolved', n, 'blocks')
