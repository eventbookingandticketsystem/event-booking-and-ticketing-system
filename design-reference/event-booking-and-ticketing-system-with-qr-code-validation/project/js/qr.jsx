// Deterministic pseudo-QR generator — looks like a real QR (finder patterns,
// timing rows, alignment block, pseudo-random data modules) but is a mock.
// Seeded from the ticket id so each ticket renders a stable, distinct code.

function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function QRCode({ value = "TIX", size = 220, n = 29, fg = "#08283B", bg = "#ffffff", quiet = 2 }) {
  const grid = React.useMemo(() => {
    const rng = mulberry32(hashStr(value));
    const g = Array.from({ length: n }, () => Array(n).fill(false));
    const reserved = Array.from({ length: n }, () => Array(n).fill(false));

    // finder pattern 7x7 at a corner
    const placeFinder = (r, c) => {
      for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) {
        const rr = r + i, cc = c + j;
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
        reserved[rr][cc] = true;
        const inRing = i >= 0 && i <= 6 && j >= 0 && j <= 6 &&
          (i === 0 || i === 6 || j === 0 || j === 6);
        const inCore = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        g[rr][cc] = inRing || inCore;
      }
    };
    placeFinder(0, 0); placeFinder(0, n - 7); placeFinder(n - 7, 0);

    // timing lines
    for (let i = 8; i < n - 8; i++) { g[6][i] = i % 2 === 0; reserved[6][i] = true; g[i][6] = i % 2 === 0; reserved[i][6] = true; }

    // alignment block bottom-right
    const a = n - 9;
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
      const rr = a + i, cc = a + j; if (rr >= n || cc >= n) continue;
      reserved[rr][cc] = true;
      g[rr][cc] = Math.abs(i) === 2 || Math.abs(j) === 2 || (i === 0 && j === 0);
    }

    // data modules
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (!reserved[r][c]) g[r][c] = rng() > 0.5;
    }
    return g;
  }, [value, n]);

  const total = n + quiet * 2;
  const cell = size / total;
  const rects = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (grid[r][c]) rects.push(
      <rect key={r + "-" + c} x={(c + quiet) * cell} y={(r + quiet) * cell} width={cell + 0.4} height={cell + 0.4} fill={fg} />
    );
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={"QR code for ticket " + value} shapeRendering="crispEdges">
      <rect width={size} height={size} fill={bg} />
      {rects}
    </svg>
  );
}

Object.assign(window, { QRCode });
