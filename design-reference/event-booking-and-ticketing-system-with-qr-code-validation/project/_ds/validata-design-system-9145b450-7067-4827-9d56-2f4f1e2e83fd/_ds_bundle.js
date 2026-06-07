/* @ds-bundle: {"format":3,"namespace":"ValidataDesignSystem_9145b4","components":[],"sourceHashes":{"dashboard/app.jsx":"b56052951cc6","dashboard/charts.jsx":"c84db3257331","dashboard/data.jsx":"9a09db9d1641","dashboard/tab1.jsx":"fd6cfc2b4e07","dashboard/tab2.jsx":"d24c67533283","dashboard/tab3.jsx":"d1d05aff9b31","dashboard/ui.jsx":"d1f3be12274d","ui_kits/app/adminPrimitives.jsx":"edea8f92db86","ui_kits/app/app.jsx":"034f39ea0e13","ui_kits/app/auditLog.jsx":"3139b571d96e","ui_kits/app/bulkSetup.jsx":"87bca7d6d335","ui_kits/app/cohorts.jsx":"4f76e6a256f1","ui_kits/app/dashboard.jsx":"3991483c35c2","ui_kits/app/downloadTemplate.jsx":"634c6ec5b859","ui_kits/app/instructorDashboard.jsx":"b41f759cc748","ui_kits/app/learnerRoster.jsx":"430e7382610a","ui_kits/app/login.jsx":"dc01c538e65c","ui_kits/app/myUploads.jsx":"28118d0b0de5","ui_kits/app/powerBi.jsx":"a9b94085d6ad","ui_kits/app/primitives.jsx":"ea4f6b41c5ce","ui_kits/app/referenceData.jsx":"11bc0aa03ac8","ui_kits/app/report.jsx":"e9057034e162","ui_kits/app/setPassword.jsx":"dfe0cdb0deeb","ui_kits/app/settings.jsx":"1666665fef11","ui_kits/app/shell.jsx":"f407155648e1","ui_kits/app/upload.jsx":"aefe19295d8d","ui_kits/app/userManagement.jsx":"63eb70bfd84a"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ValidataDesignSystem_9145b4 = window.ValidataDesignSystem_9145b4 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// dashboard/app.jsx
try { (() => {
/* ============================================================
   App shell — tabs, global filters, routing
   ============================================================ */

const TAB_NAMES = ['Account Profitability', 'Contract Performance', 'Resource Leakage'];
function App() {
  const [tab, setTab] = useState(0);
  const [region, setRegion] = useState('All');
  const [entityValue, setEntityValue] = useState('All');
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(11);
  const [toasts, setToasts] = useState([]);
  function pushToast(text) {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, {
      id,
      text
    }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }

  // per-tab secondary filter (Client / Project / Reason)
  const entityConfig = [{
    label: 'Client',
    options: [{
      value: 'All',
      label: 'All Clients'
    }, ...DATA.clients.map(c => ({
      value: c,
      label: c
    }))]
  }, {
    label: 'Project',
    options: [{
      value: 'All',
      label: 'All Projects'
    }, ...DATA.projects.map(p => ({
      value: p.project,
      label: p.project
    }))]
  }, {
    label: 'Reason',
    options: [{
      value: 'All',
      label: 'All Reasons'
    }, ...REASONS.map(r => ({
      value: r.key,
      label: r.name
    }))]
  }][tab];
  function changeTab(i) {
    setTab(i);
    setEntityValue('All'); // secondary filter differs per tab
  }
  function resetFilters() {
    setRegion('All');
    setEntityValue('All');
    setFromIdx(0);
    setToIdx(11);
  }
  const lo = Math.min(fromIdx, toIdx),
    hi = Math.max(fromIdx, toIdx);
  const dateLabel = lo === hi ? MONTHS[lo].full : `${MONTHS[lo].label} – ${MONTHS[hi].label}`;
  const filters = {
    region,
    entityValue,
    fromIdx,
    toIdx
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement(TopBar, {
    tabs: TAB_NAMES,
    active: tab,
    onTab: changeTab,
    dateLabel: dateLabel
  }), /*#__PURE__*/React.createElement(FilterBar, {
    region: region,
    setRegion: setRegion,
    entityLabel: entityConfig.label,
    entityValue: entityValue,
    setEntityValue: setEntityValue,
    entityOptions: entityConfig.options,
    fromIdx: fromIdx,
    toIdx: toIdx,
    setFrom: setFromIdx,
    setTo: setToIdx,
    onReset: resetFilters
  }), tab === 0 && /*#__PURE__*/React.createElement(Tab1, {
    filters: filters,
    pushToast: pushToast
  }), tab === 1 && /*#__PURE__*/React.createElement(Tab2, {
    filters: filters
  }), tab === 2 && /*#__PURE__*/React.createElement(Tab3, {
    filters: filters
  }), /*#__PURE__*/React.createElement("div", {
    className: "toast-wrap"
  }, toasts.map(t => /*#__PURE__*/React.createElement("div", {
    className: "toast",
    key: t.id
  }, /*#__PURE__*/React.createElement("span", {
    className: "tdot"
  }), t.text))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "dashboard/app.jsx", error: String((e && e.message) || e) }); }

// dashboard/charts.jsx
try { (() => {
/* ============================================================
   Chart components — hand-built SVG/HTML for full control.
   LineChart (with optional shaded area + reference line),
   Sparkline, HBarChart, Donut, Gauge, HeatMap.
   ============================================================ */
const {
  useState,
  useRef
} = React;

/* ---------- Sparkline (tiny, no axes) ---------- */
function Sparkline({
  points,
  color = '#FF5A00',
  width = 180,
  height = 34
}) {
  const max = Math.max(...points),
    min = Math.min(...points);
  const span = max - min || 1;
  const n = points.length;
  const x = i => n === 1 ? width / 2 : width * i / (n - 1);
  const y = v => height - 3 - (height - 6) * ((v - min) / span);
  const d = points.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${d} L${width},${height} L0,${height} Z`;
  const gid = 'sg' + color.replace('#', '');
  return /*#__PURE__*/React.createElement("svg", {
    className: "chart",
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: "none",
    style: {
      height
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: gid,
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: color,
    stopOpacity: "0.22"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: color,
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("path", {
    d: area,
    fill: `url(#${gid})`
  }), /*#__PURE__*/React.createElement("path", {
    d: d,
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  }));
}

/* ---------- LineChart ---------- */
function LineChart({
  series,
  xLabels,
  yMax,
  yMin = 0,
  yFormat = v => v,
  areaBetween = false,
  refLine = null,
  height = 300,
  valueFormat
}) {
  const W = 660,
    H = height;
  const P = {
    l: 64,
    r: 22,
    t: 18,
    b: 38
  };
  const iw = W - P.l - P.r,
    ih = H - P.t - P.b;
  const n = xLabels.length;
  const allVals = series.flatMap(s => s.points);
  const max = yMax != null ? yMax : Math.max(...allVals) * 1.08;
  const min = yMin;
  const X = i => P.l + (n === 1 ? iw / 2 : iw * i / (n - 1));
  const Y = v => P.t + ih * (1 - (v - min) / (max - min));
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const ticks = 4;
  const tickVals = Array.from({
    length: ticks + 1
  }, (_, i) => min + (max - min) * i / ticks);
  function onMove(e) {
    const r = svgRef.current.getBoundingClientRect();
    const sx = (e.clientX - r.left) / r.width * W;
    let i = Math.round((sx - P.l) / iw * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    setHover(i);
  }
  const linePath = s => s.points.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  let areaPath = '';
  if (areaBetween && series.length >= 2) {
    const top = series[0].points.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
    const bot = series[1].points.map((v, i) => `L${X(series[1].points.length - 1 - i).toFixed(1)},${Y(series[1].points[series[1].points.length - 1 - i]).toFixed(1)}`).join(' ');
    areaPath = `${top} ${bot} Z`;
  }
  const showEvery = n > 12 ? 2 : 1;
  return /*#__PURE__*/React.createElement("div", {
    className: "chart-host"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "chart",
    viewBox: `0 0 ${W} ${H}`,
    ref: svgRef,
    onMouseMove: onMove,
    onMouseLeave: () => setHover(null)
  }, tickVals.map((tv, i) => /*#__PURE__*/React.createElement("g", {
    key: i
  }, /*#__PURE__*/React.createElement("line", {
    className: "gridline",
    x1: P.l,
    y1: Y(tv),
    x2: W - P.r,
    y2: Y(tv)
  }), /*#__PURE__*/React.createElement("text", {
    className: "tick-label",
    x: P.l - 9,
    y: Y(tv) + 4,
    textAnchor: "end"
  }, yFormat(tv)))), areaPath && /*#__PURE__*/React.createElement("path", {
    d: areaPath,
    fill: "rgba(22,163,74,0.13)"
  }), refLine != null && /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("line", {
    x1: P.l,
    y1: Y(refLine.value),
    x2: W - P.r,
    y2: Y(refLine.value),
    stroke: "#94A3B8",
    strokeWidth: "1.5",
    strokeDasharray: "5 4"
  }), /*#__PURE__*/React.createElement("text", {
    className: "tick-label",
    x: W - P.r,
    y: Y(refLine.value) - 6,
    textAnchor: "end",
    style: {
      fontWeight: 700,
      fill: '#64748B'
    }
  }, refLine.label)), series.map((s, si) => /*#__PURE__*/React.createElement("path", {
    key: si,
    d: linePath(s),
    fill: "none",
    stroke: s.color,
    strokeWidth: "2.6",
    strokeLinejoin: "round",
    strokeLinecap: "round"
  })), xLabels.map((lab, i) => i % showEvery === 0 && /*#__PURE__*/React.createElement("text", {
    key: i,
    className: "tick-label",
    x: X(i),
    y: H - 14,
    textAnchor: "middle"
  }, lab)), hover != null && /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("line", {
    x1: X(hover),
    y1: P.t,
    x2: X(hover),
    y2: P.t + ih,
    stroke: "#CBD5E1",
    strokeWidth: "1"
  }), series.map((s, si) => /*#__PURE__*/React.createElement("circle", {
    key: si,
    cx: X(hover),
    cy: Y(s.points[hover]),
    r: "4.5",
    fill: "#fff",
    stroke: s.color,
    strokeWidth: "2.5"
  })))), hover != null && /*#__PURE__*/React.createElement("div", {
    className: "chart-tip",
    style: {
      left: `${X(hover) / W * 100}%`,
      top: `${Math.min(...series.map(s => Y(s.points[hover]))) / H * 100}%`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-title"
  }, xLabels[hover]), series.map((s, si) => /*#__PURE__*/React.createElement("div", {
    className: "tt-row",
    key: si
  }, /*#__PURE__*/React.createElement("span", {
    className: "sw",
    style: {
      background: s.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "lab"
  }, s.name), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, (valueFormat || yFormat)(s.points[hover]))))));
}

/* ---------- Horizontal bar chart (HTML) ---------- */
function HBarChart({
  data,
  valueFormat = v => v,
  labelWidth = 130
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return /*#__PURE__*/React.createElement("div", {
    className: "hbar-list"
  }, data.map((d, i) => /*#__PURE__*/React.createElement("div", {
    className: "hbar-row",
    key: i,
    style: {
      gridTemplateColumns: `${labelWidth}px 1fr`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "hbar-label"
  }, d.label, d.sub && /*#__PURE__*/React.createElement("span", {
    className: "sub"
  }, d.sub)), /*#__PURE__*/React.createElement("div", {
    className: "hbar-track"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hbar-fill",
    style: {
      width: `${d.value / max * 100}%`,
      background: d.color || '#FF5A00'
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "hbar-val"
  }, valueFormat(d.value))))));
}

/* ---------- Donut chart ---------- */
function Donut({
  data,
  size = 200,
  thickness = 34,
  centerTop,
  centerBottom,
  centerColor
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2,
    cy = size / 2;
  const C = 2 * Math.PI * r;
  let offset = 0;
  const [hover, setHover] = useState(null);
  return /*#__PURE__*/React.createElement("div", {
    className: "chart-host",
    style: {
      width: size,
      margin: '0 auto'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    className: "chart",
    viewBox: `0 0 ${size} ${size}`,
    style: {
      width: size,
      height: size
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: r,
    fill: "none",
    stroke: "#F1F1F1",
    strokeWidth: thickness
  }), data.map((d, i) => {
    const frac = d.value / total;
    const dash = frac * C;
    const seg = /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: cx,
      cy: cy,
      r: r,
      fill: "none",
      stroke: d.color,
      strokeWidth: hover === i ? thickness + 5 : thickness,
      strokeDasharray: `${dash} ${C - dash}`,
      strokeDashoffset: -offset,
      transform: `rotate(-90 ${cx} ${cy})`,
      style: {
        transition: 'stroke-width .12s',
        cursor: 'default'
      },
      onMouseEnter: () => setHover(i),
      onMouseLeave: () => setHover(null)
    });
    offset += dash;
    return seg;
  }), (centerTop || centerBottom) && /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("text", {
    x: cx,
    y: cy - 2,
    textAnchor: "middle",
    style: {
      fontSize: 30,
      fontWeight: 800,
      fill: centerColor || '#08283B'
    }
  }, centerTop), centerBottom && /*#__PURE__*/React.createElement("text", {
    x: cx,
    y: cy + 18,
    textAnchor: "middle",
    style: {
      fontSize: 12,
      fontWeight: 600,
      fill: '#6B7280'
    }
  }, centerBottom))), hover != null && /*#__PURE__*/React.createElement("div", {
    className: "chart-tip",
    style: {
      left: '50%',
      top: '0%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-title"
  }, data[hover].label), /*#__PURE__*/React.createElement("div", {
    className: "tt-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, (data[hover].value / total * 100).toFixed(1), "%"))));
}

/* ---------- Gauge (semicircle) ---------- */
function Gauge({
  value,
  color,
  size = 150
}) {
  const thickness = 16;
  const r = (size - thickness) / 2;
  const cx = size / 2,
    cy = size / 2;
  const C = Math.PI * r; // half circumference
  const frac = Math.max(0, Math.min(1, value / 100));
  const h = size / 2 + thickness / 2 + 8;
  return /*#__PURE__*/React.createElement("svg", {
    className: "chart",
    viewBox: `0 0 ${size} ${h}`,
    style: {
      width: size,
      height: h
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: `M ${thickness / 2} ${cy} A ${r} ${r} 0 0 1 ${size - thickness / 2} ${cy}`,
    fill: "none",
    stroke: "#EFEFEF",
    strokeWidth: thickness,
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: `M ${thickness / 2} ${cy} A ${r} ${r} 0 0 1 ${size - thickness / 2} ${cy}`,
    fill: "none",
    stroke: color,
    strokeWidth: thickness,
    strokeLinecap: "round",
    strokeDasharray: `${frac * C} ${C}`
  }));
}

/* ---------- Heatmap ---------- */
function heatColor(v) {
  if (v >= 90) return '#16A34A';
  if (v >= 75) return '#FEBE00';
  return '#DC2626';
}
function HeatMap({
  rows,
  cols
}) {
  const [tip, setTip] = useState(null);
  return /*#__PURE__*/React.createElement("div", {
    className: "chart-host"
  }, /*#__PURE__*/React.createElement("div", {
    className: "heat-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "heat-grid"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "rowh"
  }), cols.map((c, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    className: "colh"
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((row, ri) => /*#__PURE__*/React.createElement("tr", {
    key: ri
  }, /*#__PURE__*/React.createElement("th", {
    className: "rowh",
    title: row.label,
    style: row.disabled ? {
      color: '#9CA3AF'
    } : null
  }, row.label, row.warn && /*#__PURE__*/React.createElement("span", {
    className: "warn-ico",
    title: "Approximate target \u2014 needs Finance confirmation"
  }, "\u26A0")), row.disabled ? /*#__PURE__*/React.createElement("td", {
    colSpan: cols.length,
    style: {
      color: '#9CA3AF',
      fontSize: 11.5,
      fontStyle: 'italic',
      paddingLeft: 4
    }
  }, "No Target \u2014 confidence unavailable") : row.values.map((v, ci) => /*#__PURE__*/React.createElement("td", {
    key: ci
  }, /*#__PURE__*/React.createElement("div", {
    className: "heat-cell",
    style: {
      background: heatColor(v)
    },
    onMouseMove: e => setTip({
      v,
      label: row.label,
      col: cols[ci],
      x: e.clientX,
      y: e.clientY
    }),
    onMouseLeave: () => setTip(null)
  })))))))), /*#__PURE__*/React.createElement("div", {
    className: "heat-legend"
  }, /*#__PURE__*/React.createElement("span", {
    className: "li"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sw",
    style: {
      background: '#16A34A'
    }
  }), " \u2265 90% On Track"), /*#__PURE__*/React.createElement("span", {
    className: "li"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sw",
    style: {
      background: '#FEBE00'
    }
  }), " 75\u201390% At Risk"), /*#__PURE__*/React.createElement("span", {
    className: "li"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sw",
    style: {
      background: '#DC2626'
    }
  }), " < 75% Off Track")), tip && /*#__PURE__*/React.createElement("div", {
    className: "chart-tip",
    style: {
      position: 'fixed',
      left: tip.x,
      top: tip.y - 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-title"
  }, tip.label), /*#__PURE__*/React.createElement("div", {
    className: "tt-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lab"
  }, tip.col), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, tip.v.toFixed(0), "%"))));
}
Object.assign(window, {
  Sparkline,
  LineChart,
  HBarChart,
  Donut,
  Gauge,
  HeatMap,
  heatColor
});

/* ---------- Stacked horizontal bar chart ---------- */
function StackedHBar({
  data,
  segKeys,
  valueFormat = v => v,
  labelWidth = 150,
  tipRender
}) {
  const max = Math.max(...data.map(d => segKeys.reduce((s, k) => s + (d[k.key] || 0), 0)), 1);
  const [tip, setTip] = useState(null);
  return /*#__PURE__*/React.createElement("div", {
    className: "chart-host"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hbar-list"
  }, data.map((d, i) => {
    const total = segKeys.reduce((s, k) => s + (d[k.key] || 0), 0);
    return /*#__PURE__*/React.createElement("div", {
      className: "hbar-row",
      key: i,
      style: {
        gridTemplateColumns: `${labelWidth}px 1fr`
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "hbar-label"
    }, d.label, d.sub && /*#__PURE__*/React.createElement("span", {
      className: "sub"
    }, d.sub)), /*#__PURE__*/React.createElement("div", {
      className: "hbar-track"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        width: `${total / max * 100}%`,
        minWidth: 2,
        height: 18,
        borderRadius: 4,
        overflow: 'hidden'
      },
      onMouseMove: e => setTip({
        d,
        x: e.clientX,
        y: e.clientY
      }),
      onMouseLeave: () => setTip(null)
    }, segKeys.map((k, si) => d[k.key] > 0 && /*#__PURE__*/React.createElement("div", {
      key: si,
      style: {
        width: `${d[k.key] / total * 100}%`,
        background: k.color,
        height: '100%'
      }
    }))), /*#__PURE__*/React.createElement("span", {
      className: "hbar-val"
    }, valueFormat(total))));
  })), tip && /*#__PURE__*/React.createElement("div", {
    className: "chart-tip",
    style: {
      position: 'fixed',
      left: tip.x,
      top: tip.y - 14
    }
  }, tipRender ? tipRender(tip.d) : /*#__PURE__*/React.createElement("div", {
    className: "tt-title"
  }, tip.d.label)));
}

/* ---------- Waterfall chart ---------- */
function Waterfall({
  start,
  steps,
  end,
  height = 320,
  valueFormat = v => v
}) {
  // build cumulative bars: start (total), each step (variance), end (total)
  const W = 1180,
    H = height;
  const P = {
    l: 8,
    r: 8,
    t: 26,
    b: 96
  };
  const iw = W - P.l - P.r,
    ih = H - P.t - P.b;
  const bars = [];
  let cum = start.value;
  bars.push({
    type: 'total',
    label: start.label,
    base: 0,
    top: start.value,
    value: start.value,
    color: '#08283B'
  });
  steps.forEach(s => {
    const from = cum;
    const to = cum + s.value;
    bars.push({
      type: 'step',
      label: s.label,
      base: Math.min(from, to),
      top: Math.max(from, to),
      value: s.value,
      color: s.value >= 0 ? '#16A34A' : '#DC2626'
    });
    cum = to;
  });
  bars.push({
    type: 'total',
    label: end.label,
    base: 0,
    top: end.value,
    value: end.value,
    color: '#08283B'
  });
  const maxV = Math.max(...bars.map(b => b.top)) * 1.05;
  const n = bars.length;
  const gap = 14;
  const bw = (iw - gap * (n - 1)) / n;
  const X = i => P.l + i * (bw + gap);
  const Y = v => P.t + ih * (1 - v / maxV);
  const [hover, setHover] = useState(null);
  return /*#__PURE__*/React.createElement("div", {
    className: "chart-host"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "chart",
    viewBox: `0 0 ${W} ${H}`
  }, [0, 0.25, 0.5, 0.75, 1].map((f, i) => {
    const v = maxV * f;
    return /*#__PURE__*/React.createElement("g", {
      key: i
    }, /*#__PURE__*/React.createElement("line", {
      className: "gridline",
      x1: P.l,
      y1: Y(v),
      x2: W - P.r,
      y2: Y(v)
    }), /*#__PURE__*/React.createElement("text", {
      className: "tick-label",
      x: P.l + 2,
      y: Y(v) - 4
    }, valueFormat(v)));
  }), bars.map((b, i) => {
    const y = Y(b.top),
      h = Math.max(2, Y(b.base) - Y(b.top));
    return /*#__PURE__*/React.createElement("g", {
      key: i,
      onMouseEnter: () => setHover(i),
      onMouseLeave: () => setHover(null)
    }, i > 0 && i < n && /*#__PURE__*/React.createElement("line", {
      x1: X(i - 1) + bw,
      y1: Y(bars[i - 1].type === 'total' ? bars[i - 1].top : bars[i - 1].value >= 0 ? bars[i - 1].top : bars[i - 1].base),
      x2: X(i),
      y2: Y(b.type === 'total' ? b.top : b.value >= 0 ? b.base : b.top),
      stroke: "#CBD5E1",
      strokeWidth: "1",
      strokeDasharray: "4 3"
    }), /*#__PURE__*/React.createElement("rect", {
      x: X(i),
      y: y,
      width: bw,
      height: h,
      rx: "3",
      fill: b.color,
      opacity: hover == null || hover === i ? 1 : 0.55,
      style: {
        transition: 'opacity .12s'
      }
    }), /*#__PURE__*/React.createElement("text", {
      x: X(i) + bw / 2,
      y: y - 7,
      textAnchor: "middle",
      style: {
        fontSize: 11,
        fontWeight: 700,
        fill: b.color
      }
    }, b.type === 'step' ? (b.value >= 0 ? '+' : '') + valueFormat(b.value) : valueFormat(b.value)), /*#__PURE__*/React.createElement("text", {
      x: X(i) + bw / 2,
      y: H - P.b + 16,
      textAnchor: "end",
      transform: `rotate(-35 ${X(i) + bw / 2} ${H - P.b + 16})`,
      style: {
        fontSize: 10.5,
        fill: '#6B7280',
        fontWeight: b.type === 'total' ? 700 : 500
      }
    }, b.label.length > 26 ? b.label.slice(0, 25) + '…' : b.label));
  })), hover != null && /*#__PURE__*/React.createElement("div", {
    className: "chart-tip",
    style: {
      left: `${(X(hover) + bw / 2) / W * 100}%`,
      top: `${Y(bars[hover].top) / H * 100}%`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tt-title"
  }, bars[hover].label), /*#__PURE__*/React.createElement("div", {
    className: "tt-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, (bars[hover].type === 'step' && bars[hover].value >= 0 ? '+' : '') + valueFormat(bars[hover].value)))));
}
Object.assign(window, {
  StackedHBar,
  Waterfall
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "dashboard/charts.jsx", error: String((e && e.message) || e) }); }

// dashboard/data.jsx
try { (() => {
/* ============================================================
   Mock data + formatting helpers
   Deterministic (seeded) so values are stable across renders.
   ============================================================ */

const RATE = 1.09; // EUR -> USD

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---------- Currency / number formatting ---------- */
function eur(n) {
  return '€' + Math.round(n).toLocaleString('en-US');
}
function usd(n) {
  return '$' + Math.round(n * RATE).toLocaleString('en-US');
}
function eurusd(n) {
  return eur(n) + ' / ' + usd(n);
}
function kEur(n) {
  const a = Math.abs(n);
  if (a >= 1e6) return '€' + (n / 1e6).toFixed(1) + 'M';
  return '€' + Math.round(n / 1000) + 'K';
}
function kUsd(n) {
  const v = n * RATE;
  const a = Math.abs(v);
  if (a >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  return '$' + Math.round(v / 1000) + 'K';
}
function kEurUsd(n) {
  return kEur(n) + ' / ' + kUsd(n);
}
function axisEur(n) {
  if (Math.abs(n) >= 1e6) return '€' + (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return '€' + Math.round(n / 1000) + 'K';
  return '€' + Math.round(n);
}
function pct(n, d = 1) {
  return n.toFixed(d) + '%';
}

/* ---------- Margin flag ---------- */
function marginFlag(marginPct, hasRevenue) {
  if (!hasRevenue) return {
    key: 'norev',
    label: 'No Revenue',
    color: '#6B7280',
    cls: 'pill-norev'
  };
  if (marginPct >= 25) return {
    key: 'good',
    label: 'Good',
    color: '#16A34A',
    cls: 'pill-good'
  };
  if (marginPct >= 15) return {
    key: 'warning',
    label: 'Warning',
    color: '#FEBE00',
    cls: 'pill-warning'
  };
  return {
    key: 'critical',
    label: 'Critical',
    color: '#DC2626',
    cls: 'pill-critical'
  };
}

/* ---------- Months: Jul 2025 – Jun 2026 ---------- */
const MONTHS = function () {
  const out = [];
  const d = new Date(2025, 6, 1);
  for (let i = 0; i < 12; i++) {
    const mo = d.toLocaleString('en-US', {
      month: 'short'
    });
    const yy = String(d.getFullYear()).slice(2);
    out.push({
      idx: i,
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      short: mo,
      label: `${mo} ${yy}`,
      full: `${d.toLocaleString('en-US', {
        month: 'long'
      })} ${d.getFullYear()}`
    });
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}();
const REGIONS = ['Europe', 'West Africa', 'North America'];

/* ---------- Client definitions ---------- */
const CLIENT_DEFS = [{
  name: 'Acme Corp',
  region: 'Europe',
  entity: 'AmaliTech GmbH',
  baseRev: 110000,
  baseMargin: 0.38,
  full: true
}, {
  name: 'Beta Solutions',
  region: 'West Africa',
  entity: 'AmaliTech Ghana',
  baseRev: 42000,
  baseMargin: 0.12,
  full: true
}, {
  name: 'Gamma Industries',
  region: 'North America',
  entity: 'AmaliTech GmbH',
  baseRev: 88000,
  baseMargin: 0.28,
  full: true
}, {
  name: 'Delta Services',
  region: 'Europe',
  entity: 'AmaliTech GmbH',
  baseRev: 65000,
  baseMargin: 0.45,
  full: true
}, {
  name: 'Epsilon Tech',
  region: 'West Africa',
  entity: 'AmaliTech Ghana',
  baseRev: 30000,
  baseMargin: 0.09,
  full: false
}, {
  name: 'Zeta Consulting',
  region: 'North America',
  entity: 'AmaliTech GmbH',
  baseRev: 72000,
  baseMargin: 0.22,
  full: true
}, {
  name: 'Eta Digital',
  region: 'Europe',
  entity: 'AmaliTech GmbH',
  baseRev: 55000,
  baseMargin: 0.18,
  full: true
}, {
  name: 'Theta Group',
  region: 'West Africa',
  entity: 'AmaliTech Ghana',
  baseRev: 25000,
  baseMargin: 0.15,
  full: false
}, {
  name: 'Iota Partners',
  region: 'North America',
  entity: 'AmaliTech GmbH',
  baseRev: 120000,
  baseMargin: 0.30,
  full: true
}, {
  name: 'Kappa Systems',
  region: 'Europe',
  entity: 'AmaliTech GmbH',
  baseRev: 48000,
  baseMargin: 0.40,
  full: true
}];

/* ---------- Build account rows: one per client per month ---------- */
function buildAccountRows() {
  const rng = mulberry32(20260604);
  const rows = [];
  CLIENT_DEFS.forEach((c, ci) => {
    // gentle seasonal growth curve per client
    MONTHS.forEach((m, mi) => {
      const season = 1 + 0.10 * Math.sin(mi / 12 * Math.PI * 2 + ci);
      const noise = 0.85 + rng() * 0.30;
      const revenue = Math.max(0, c.baseRev * season * noise);
      const marginNoise = (rng() - 0.5) * 0.10;
      let margin = Math.max(0.02, c.baseMargin + marginNoise);
      const cost = revenue * (1 - margin);
      const grossProfit = revenue - cost;
      const grossMarginPct = grossProfit / revenue * 100;
      const headcount = Math.max(2, Math.round(revenue / 11000 + rng() * 3));
      const invoices = 1 + Math.floor(rng() * 6);
      const nonBillable = c.full ? revenue * (0.02 + rng() * 0.05) : revenue * (0.04 + rng() * 0.08);
      rows.push({
        client: c.name,
        entity: c.entity,
        region: c.region,
        monthIdx: mi,
        monthKey: m.key,
        monthLabel: m.label,
        revenue,
        cost,
        personnelCost: cost * 0.82,
        grossProfit,
        grossMarginPct,
        flag: marginFlag(grossMarginPct, revenue > 0),
        headcount,
        invoices,
        hasFullCostData: c.full,
        nonBillableCost: nonBillable
      });
    });
  });
  return rows;
}

/* ---------- Leakage flag (contract) ---------- */
function leakageFlag(leakagePct, hasTarget) {
  if (!hasTarget) return {
    key: 'no_target',
    label: 'No Target',
    color: '#6B7280',
    cls: 'pill-norev'
  };
  if (leakagePct <= 5) return {
    key: 'ok',
    label: 'OK',
    color: '#16A34A',
    cls: 'pill-good'
  };
  if (leakagePct <= 15) return {
    key: 'warning',
    label: 'Warning',
    color: '#FEBE00',
    cls: 'pill-warning'
  };
  return {
    key: 'critical',
    label: 'Critical',
    color: '#DC2626',
    cls: 'pill-critical'
  };
}

/* ---------- Build projects: 2 per client (20 total) ---------- */
const PROJECT_SUFFIX = ['Platform Rebuild', 'Data Migration', 'Cloud Modernisation', 'Mobile App', 'Analytics Portal', 'API Integration', 'Security Uplift', 'Billing Engine', 'Customer Portal', 'ML Pipeline'];
const BILLING_CYCLE = ['Fixed Price', 'Time & Material', 'Retainer'];
function confidenceMeta(key) {
  if (key === 'exact') return {
    key,
    label: 'Exact',
    cls: 'tag-completed'
  };
  if (key === 'approximate') return {
    key,
    label: 'Approximate',
    cls: 'tag-warning'
  };
  return {
    key,
    label: 'Unavailable',
    cls: 'tag-gray'
  };
}
function buildProjects() {
  const rng = mulberry32(77123);
  const projects = [];
  let n = 0;
  CLIENT_DEFS.forEach((c, ci) => {
    for (let p = 0; p < 2; p++) {
      const name = `${c.name.split(' ')[0]} — ${PROJECT_SUFFIX[(ci + p * 5) % PROJECT_SUFFIX.length]}`;
      const billing = BILLING_CYCLE[n % 3];
      // target_confidence: Fixed Price/T&M -> exact, Retainer -> approximate,
      // plus exactly one T&M project forced to "unavailable" (no rate card).
      let confidence = billing === 'Retainer' ? 'approximate' : 'exact';
      if (n === 4) confidence = 'unavailable'; // a single T&M with no rate card
      const hasTarget = confidence !== 'unavailable';
      const status = rng() > 0.35 ? 'Active' : 'Completed';
      const meanAttain = 60 + rng() * 55; // 60–115
      const monthly = MONTHS.map(() => Math.max(48, Math.min(120, meanAttain + (rng() - 0.5) * 22)));
      const targetPerMonth = hasTarget ? c.baseRev * (0.4 + rng() * 0.5) : null;
      const monthlyTarget = MONTHS.map(() => targetPerMonth);
      const monthlyActual = MONTHS.map((m, i) => hasTarget ? targetPerMonth * (monthly[i] / 100) : c.baseRev * (0.3 + rng() * 0.4));
      const monthlyLeak = MONTHS.map((m, i) => hasTarget ? Math.max(0, monthlyTarget[i] - monthlyActual[i]) : 0);
      const targetRevenue = hasTarget ? targetPerMonth * 12 : null;
      const actualRevenue = monthlyActual.reduce((s, v) => s + v, 0);
      const variance = hasTarget ? actualRevenue - targetRevenue : 0;
      const attainment = hasTarget ? actualRevenue / targetRevenue * 100 : null;
      const leakageTotal = monthlyLeak.reduce((s, v) => s + v, 0);
      const leakagePct = hasTarget ? leakageTotal / targetRevenue * 100 : 0;
      const margin = Math.max(0.05, c.baseMargin + (rng() - 0.5) * 0.12);
      const grossMarginPct = margin * 100;
      const cost = actualRevenue * (1 - margin);
      projects.push({
        id: 'P' + n,
        project: name,
        client: c.name,
        region: c.region,
        entity: c.entity,
        billing,
        status,
        confidence,
        confidenceMeta: confidenceMeta(confidence),
        hasTarget,
        targetRevenue,
        actualRevenue,
        variance,
        cost,
        grossMarginPct,
        attainment,
        monthly,
        monthlyTarget,
        monthlyActual,
        monthlyLeak,
        leakageTotal,
        leakagePct,
        leakFlag: leakageFlag(leakagePct, hasTarget),
        flag: marginFlag(grossMarginPct, true)
      });
      n++;
    }
  });
  return projects;
}

/* ---------- Build employees: 30, per-employee-per-project-per-month leakage ---------- */
const EMP_NAMES = ['Kwame Asante', 'Ama Mensah', 'Kofi Boateng', 'Akua Owusu', 'Yaw Darko', 'Abena Sarpong', 'Kojo Annan', 'Efua Addo', 'Kwabena Osei', 'Adwoa Agyeman', 'Fiifi Quartey', 'Esi Bonsu', 'Nana Acheampong', 'Maa Adjei', 'Kwesi Appiah', 'Akosua Frimpong', 'Yaa Asantewaa', 'Kojo Mensah', 'Ama Serwaa', 'Kwame Tetteh', 'Lukas Müller', 'Hannah Schmidt', 'Sofia Rossi', 'James Carter', 'Emily Brown', 'Daniel Becker', 'Laura Klein', 'Thomas Wagner', 'Maria Lopez', 'Oliver Smith'];
const ROLES = ['Senior Developer', 'Developer', 'Designer', 'QA Engineer', 'Project Manager'];
const SENIORITY = ['Junior', 'Mid', 'Senior'];

/* Leakage reasons (ACCOUNT-363 classification) */
const REASONS = [{
  key: 'over_allocated',
  name: 'Over-Allocated',
  color: '#FF5A00',
  cls: 'pill-orange'
}, {
  key: 'non_billable',
  name: 'Non-Billable',
  color: '#08283B',
  cls: 'pill-navy'
}, {
  key: 'over_allocated_non_billable',
  name: 'Over-Allocated + Non-Billable',
  color: '#DC2626',
  cls: 'pill-critical'
}, {
  key: 'ok',
  name: 'OK',
  color: '#16A34A',
  cls: 'pill-good'
}];
const REASON_BY_KEY = Object.fromEntries(REASONS.map(r => [r.key, r]));
const FTE_STEPS = [0.25, 0.5, 0.75, 1.0];
function buildEmployees() {
  const rng = mulberry32(55012);
  const emps = [];
  EMP_NAMES.forEach((nm, i) => {
    const role = ROLES[i % ROLES.length];
    const seniority = SENIORITY[Math.floor(rng() * 3)];
    const region = REGIONS[i % REGIONS.length];
    const entity = region === 'West Africa' ? 'AmaliTech Ghana' : 'AmaliTech GmbH';
    const monthlyCpp = 2500 + Math.round(rng() * 35) * 100; // €2,500–€6,000

    // Decide a profile so leakage rates stay realistic
    const roll = rng();
    const makeOverAllocated = roll < 0.22; // ~22% over-allocated
    const makeNonBillable = rng() < 0.26; // ~26% have non-billable work

    const numProj = makeOverAllocated ? 2 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 2);
    const assignments = [];
    let totalFte = 0;
    for (let a = 0; a < numProj; a++) {
      const proj = DATA_PROJECTS[Math.floor(rng() * DATA_PROJECTS.length)];
      // smaller FTE steps so totals stay near 1.0 unless deliberately over-allocated
      let fte = [0.25, 0.5, 0.5, 0.75][Math.floor(rng() * 4)];
      assignments.push({
        project: proj.project,
        client: proj.client,
        fte,
        billable: true
      });
      totalFte += fte;
    }
    totalFte = Math.round(totalFte * 100) / 100;
    if (makeOverAllocated && totalFte <= 1.0) {
      // nudge into over-allocation
      assignments[0].fte = Math.min(1.0, assignments[0].fte + 0.5);
      totalFte = Math.round(assignments.reduce((s, a) => s + a.fte, 0) * 100) / 100;
    } else if (!makeOverAllocated && totalFte > 1.0) {
      // scale back down to <= 1.0
      const scale = 1.0 / totalFte;
      assignments.forEach(a => {
        a.fte = Math.round(a.fte * scale * 4) / 4 || 0.25;
      });
      totalFte = Math.round(assignments.reduce((s, a) => s + a.fte, 0) * 100) / 100;
    }
    if (makeNonBillable) assignments[assignments.length - 1].billable = false;
    const overAllocated = totalFte > 1.0;
    const excessFte = Math.max(0, totalFte - 1.0);
    const hasNonBillable = assignments.some(a => !a.billable);
    let reasonKey = 'ok';
    if (overAllocated && hasNonBillable) reasonKey = 'over_allocated_non_billable';else if (overAllocated) reasonKey = 'over_allocated';else if (hasNonBillable) reasonKey = 'non_billable';
    const reason = REASON_BY_KEY[reasonKey];

    // monthly proration factor (0 = not active that month)
    const monthlyProration = MONTHS.map(() => rng() > 0.1 ? 0.85 + rng() * 0.15 : 0);
    emps.push({
      id: 'E' + i,
      name: nm,
      role,
      seniority,
      region,
      entity,
      monthlyCpp,
      assignments,
      totalFte,
      overAllocated,
      excessFte,
      hasNonBillable,
      reasonKey,
      reason,
      monthlyProration
    });
  });
  return emps;
}

/* Flat leakage detail rows: per employee per project per month */
function buildLeakageDetail(emps) {
  const rows = [];
  emps.forEach(e => {
    MONTHS.forEach((m, mi) => {
      const pf = e.monthlyProration[mi];
      if (pf <= 0) return;
      e.assignments.forEach(a => {
        const nonBillableCost = a.billable ? 0 : a.fte * e.monthlyCpp * pf;
        const overAllocCost = e.totalFte > 0 ? a.fte / e.totalFte * e.excessFte * e.monthlyCpp * pf : 0;
        const leakageCost = nonBillableCost + overAllocCost;
        rows.push({
          empId: e.id,
          name: e.name,
          seniority: e.seniority,
          role: e.role,
          region: e.region,
          entity: e.entity,
          project: a.project,
          client: a.client,
          allocatedFte: a.fte,
          totalFte: e.totalFte,
          overAllocated: e.overAllocated,
          billable: a.billable,
          billability: a.billable ? 'Billable' : 'Not_Billable',
          reasonKey: e.reasonKey,
          reason: e.reason,
          monthlyCpp: e.monthlyCpp,
          overAllocCost,
          nonBillableCost,
          leakageCost,
          monthIdx: mi,
          monthLabel: m.label
        });
      });
    });
  });
  return rows;
}
const DATA_PROJECTS = buildProjects();
const DATA_EMPLOYEES = buildEmployees();
const DATA_LEAKAGE = buildLeakageDetail(DATA_EMPLOYEES);
const DATA = {
  accounts: buildAccountRows(),
  projects: DATA_PROJECTS,
  employees: DATA_EMPLOYEES,
  leakage: DATA_LEAKAGE,
  months: MONTHS,
  regions: REGIONS,
  clients: CLIENT_DEFS.map(c => c.name),
  reasons: REASONS
};
Object.assign(window, {
  RATE,
  eur,
  usd,
  eurusd,
  kEur,
  kUsd,
  kEurUsd,
  axisEur,
  pct,
  marginFlag,
  leakageFlag,
  MONTHS,
  REGIONS,
  REASONS,
  REASON_BY_KEY,
  DATA
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "dashboard/data.jsx", error: String((e && e.message) || e) }); }

// dashboard/tab1.jsx
try { (() => {
/* ============================================================
   TAB 1 — Account Profitability  (+ Overhead Adjustment)
   ============================================================ */

function Tab1({
  filters,
  pushToast
}) {
  const {
    region,
    entityValue,
    fromIdx,
    toIdx
  } = filters;
  const lo = Math.min(fromIdx, toIdx),
    hi = Math.max(fromIdx, toIdx);

  // Overhead state: keyed by `${client}__${monthIdx}` -> percent. Session only.
  const [overheads, setOverheads] = useState({});
  const [ohClient, setOhClient] = useState(DATA.clients[0]);
  const [ohMonth, setOhMonth] = useState('0');
  const [ohPct, setOhPct] = useState('');
  const ohKey = (client, monthIdx) => `${client}__${monthIdx}`;

  // base rows in scope
  const baseRows = DATA.accounts.filter(r => (region === 'All' || r.region === region) && (entityValue === 'All' || r.client === entityValue) && r.monthIdx >= lo && r.monthIdx <= hi);

  // apply overhead adjustments
  const rows = useMemo(() => baseRows.map(r => {
    const pct = overheads[ohKey(r.client, r.monthIdx)];
    const overheadPct = pct != null ? pct : 0;
    const overheadCost = r.revenue * (overheadPct / 100);
    const adjustedProfit = r.grossProfit - overheadCost;
    const adjustedMargin = r.revenue ? adjustedProfit / r.revenue * 100 : 0;
    return {
      ...r,
      hasOverhead: pct != null,
      overheadPct,
      overheadCost,
      adjustedProfit,
      adjustedMargin,
      adjFlag: marginFlag(adjustedMargin, r.revenue > 0)
    };
  }), [baseRows, overheads]);

  // KPIs use adjusted figures
  const totalRev = rows.reduce((s, r) => s + r.revenue, 0);
  const totalAdjGP = rows.reduce((s, r) => s + r.adjustedProfit, 0);
  const totalBaseGP = rows.reduce((s, r) => s + r.grossProfit, 0);
  const avgMargin = totalRev ? totalAdjGP / totalRev * 100 : 0;
  const activeAccounts = new Set(rows.filter(r => r.revenue > 0).map(r => r.client)).size;
  const avgFlag = marginFlag(avgMargin, totalRev > 0);
  const ohCount = Object.keys(overheads).length;
  const monthsInRange = MONTHS.slice(lo, hi + 1);
  const byMonth = monthsInRange.map(m => {
    const mr = rows.filter(r => r.monthIdx === m.idx);
    return {
      label: m.short,
      revenue: mr.reduce((s, r) => s + r.revenue, 0),
      cost: mr.reduce((s, r) => s + r.personnelCost, 0),
      adjProfit: mr.reduce((s, r) => s + r.adjustedProfit, 0)
    };
  });
  const byClient = {};
  rows.forEach(r => {
    if (!byClient[r.client]) byClient[r.client] = {
      profit: 0,
      rev: 0,
      client: r.client
    };
    byClient[r.client].profit += r.adjustedProfit;
    byClient[r.client].rev += r.revenue;
  });
  const topAccounts = Object.values(byClient).map(c => {
    const m = c.profit / c.rev * 100;
    return {
      ...c,
      flag: marginFlag(m, c.rev > 0)
    };
  }).sort((a, b) => b.profit - a.profit).slice(0, 10).map(c => ({
    label: c.client,
    value: c.profit,
    color: c.flag.color
  }));

  // applied overheads list (with overhead cost looked up from the account row)
  const appliedList = Object.entries(overheads).map(([k, pct]) => {
    const [client, mi] = k.split('__');
    const row = DATA.accounts.find(r => r.client === client && r.monthIdx === Number(mi));
    return {
      key: k,
      client,
      monthIdx: Number(mi),
      monthLabel: MONTHS[Number(mi)].label,
      pct,
      cost: row ? row.revenue * (pct / 100) : 0
    };
  }).sort((a, b) => a.client.localeCompare(b.client) || a.monthIdx - b.monthIdx);
  function applyOverhead() {
    const v = parseFloat(ohPct);
    if (isNaN(v) || v < 0 || v > 50) return;
    const rounded = Math.round(v * 2) / 2;
    setOverheads(o => ({
      ...o,
      [ohKey(ohClient, Number(ohMonth))]: rounded
    }));
    pushToast(`Overhead set: ${ohClient} — ${MONTHS[Number(ohMonth)].label}: ${rounded}%`);
    setOhPct('');
  }
  function removeOverhead(key) {
    setOverheads(o => {
      const n = {
        ...o
      };
      delete n[key];
      return n;
    });
  }
  const columns = [{
    key: 'client',
    label: 'Client',
    render: r => /*#__PURE__*/React.createElement("span", {
      className: "cell-strong"
    }, r.client, r.hasOverhead && /*#__PURE__*/React.createElement("span", {
      className: "gold-dot",
      title: "Overhead applied"
    }))
  }, {
    key: 'entity',
    label: 'Entity',
    render: r => /*#__PURE__*/React.createElement("span", {
      className: "tag"
    }, r.entity)
  }, {
    key: 'region',
    label: 'Region'
  }, {
    key: 'monthLabel',
    label: 'Month',
    sortValue: r => r.monthIdx
  }, {
    key: 'revenue',
    label: 'Revenue',
    numeric: true,
    render: r => /*#__PURE__*/React.createElement("span", {
      className: "cell-dual"
    }, /*#__PURE__*/React.createElement("span", null, eur(r.revenue)), /*#__PURE__*/React.createElement("span", {
      className: "cell-usd"
    }, usd(r.revenue)))
  }, {
    key: 'cost',
    label: 'Cost',
    numeric: true,
    render: r => eur(r.cost)
  }, {
    key: 'grossProfit',
    label: 'Gross Profit',
    numeric: true,
    render: r => eur(r.grossProfit)
  }, {
    key: 'overheadPct',
    label: 'Overhead %',
    numeric: true,
    render: r => r.hasOverhead ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700,
        color: '#C2410C'
      }
    }, pct(r.overheadPct), /*#__PURE__*/React.createElement("span", {
      className: "gold-dot"
    })) : /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--muted)'
      }
    }, "\u2014")
  }, {
    key: 'overheadCost',
    label: 'Overhead Cost',
    numeric: true,
    render: r => r.hasOverhead ? /*#__PURE__*/React.createElement("span", {
      className: "cell-dual"
    }, /*#__PURE__*/React.createElement("span", null, eur(r.overheadCost)), /*#__PURE__*/React.createElement("span", {
      className: "cell-usd"
    }, usd(r.overheadCost))) : /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--muted)'
      }
    }, "\u20AC0")
  }, {
    key: 'adjustedProfit',
    label: 'Adj. Profit',
    numeric: true,
    render: r => /*#__PURE__*/React.createElement("span", {
      className: "cell-dual"
    }, /*#__PURE__*/React.createElement("span", null, eur(r.adjustedProfit)), /*#__PURE__*/React.createElement("span", {
      className: "cell-usd"
    }, usd(r.adjustedProfit)))
  }, {
    key: 'adjustedMargin',
    label: 'Adj. Margin %',
    numeric: true,
    render: r => /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700,
        color: r.adjFlag.color
      }
    }, pct(r.adjustedMargin))
  }, {
    key: 'adjFlag',
    label: 'Flag',
    sortable: false,
    render: r => /*#__PURE__*/React.createElement(FlagPill, {
      flag: r.adjFlag
    })
  }, {
    key: 'headcount',
    label: 'HC',
    numeric: true
  }, {
    key: 'invoices',
    label: 'Inv',
    numeric: true
  }];
  const gpDelta = totalBaseGP - totalAdjGP;
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row kpi-4"
  }, /*#__PURE__*/React.createElement(KpiCard, {
    label: "Total Revenue (YTD)",
    value: eur(totalRev),
    sub: usd(totalRev),
    accent: "#FF5A00"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-spark"
  }, /*#__PURE__*/React.createElement(Sparkline, {
    points: byMonth.map(m => m.revenue),
    color: "#FF5A00"
  }))), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Total Gross Profit (YTD)",
    value: eur(totalAdjGP),
    sub: ohCount ? `after −${eur(gpDelta)} overhead` : usd(totalAdjGP),
    accent: "#16A34A"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-spark"
  }, /*#__PURE__*/React.createElement(Sparkline, {
    points: byMonth.map(m => m.adjProfit),
    color: "#16A34A"
  }))), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Average Margin %",
    value: pct(avgMargin),
    valueColor: avgFlag.color,
    accent: avgFlag.color,
    sub: `Weighted across ${activeAccounts} accounts`
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement(FlagPill, {
    flag: avgFlag
  }))), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Active Accounts",
    value: activeAccounts,
    sub: `of ${DATA.clients.length} total clients`,
    accent: "#08283B"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-sub",
    style: {
      marginTop: 'auto',
      paddingTop: 12
    }
  }, ohCount ? `${ohCount} overhead adjustment${ohCount > 1 ? 's' : ''} applied` : `${monthsInRange.length} month${monthsInRange.length > 1 ? 's' : ''} selected`))), /*#__PURE__*/React.createElement("div", {
    className: "row c-60-40"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Monthly Revenue vs Cost",
    sub: "Shaded area = gross profit",
    right: /*#__PURE__*/React.createElement("div", {
      className: "legend-inline"
    }, /*#__PURE__*/React.createElement("span", {
      className: "li"
    }, /*#__PURE__*/React.createElement("span", {
      className: "ln",
      style: {
        background: '#FF5A00'
      }
    }), "Revenue"), /*#__PURE__*/React.createElement("span", {
      className: "li"
    }, /*#__PURE__*/React.createElement("span", {
      className: "ln",
      style: {
        background: '#08283B'
      }
    }), "Personnel Cost"))
  }, /*#__PURE__*/React.createElement(LineChart, {
    xLabels: byMonth.map(m => m.label),
    series: [{
      name: 'Revenue',
      color: '#FF5A00',
      points: byMonth.map(m => m.revenue)
    }, {
      name: 'Personnel Cost',
      color: '#08283B',
      points: byMonth.map(m => m.cost)
    }],
    areaBetween: true,
    yMin: 0,
    yFormat: axisEur,
    valueFormat: v => eurusd(v)
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Top 10 Accounts by Profit",
    sub: "Colored by margin flag (overhead-adjusted)"
  }, /*#__PURE__*/React.createElement(HBarChart, {
    data: topAccounts,
    valueFormat: v => kEur(v),
    labelWidth: 120
  }))), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "All Accounts \u2014 Monthly Breakdown",
    sub: "Default sort: adjusted margin ascending (worst first) \u2014 click any header to re-sort"
  }, /*#__PURE__*/React.createElement(DataTable, {
    columns: columns,
    rows: rows,
    initialSort: {
      key: 'adjustedMargin',
      dir: 'asc'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "oh-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "oh-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "oh-form"
  }, /*#__PURE__*/React.createElement("p", {
    className: "oh-form-title"
  }, "Overhead Adjustment \u2014 set overhead % for an account"), /*#__PURE__*/React.createElement("div", {
    className: "oh-controls"
  }, /*#__PURE__*/React.createElement("div", {
    className: "oh-field"
  }, /*#__PURE__*/React.createElement("span", {
    className: "filter-label"
  }, "Account"), /*#__PURE__*/React.createElement(Select, {
    value: ohClient,
    onChange: setOhClient,
    options: DATA.clients.map(c => ({
      value: c,
      label: c
    }))
  })), /*#__PURE__*/React.createElement("div", {
    className: "oh-field"
  }, /*#__PURE__*/React.createElement("span", {
    className: "filter-label"
  }, "Month"), /*#__PURE__*/React.createElement(Select, {
    value: ohMonth,
    onChange: setOhMonth,
    options: MONTHS.map(m => ({
      value: String(m.idx),
      label: m.label
    }))
  })), /*#__PURE__*/React.createElement("div", {
    className: "oh-field"
  }, /*#__PURE__*/React.createElement("span", {
    className: "filter-label"
  }, "Overhead %"), /*#__PURE__*/React.createElement("div", {
    className: "oh-num-wrap"
  }, /*#__PURE__*/React.createElement("input", {
    className: "oh-num",
    type: "number",
    min: "0",
    max: "50",
    step: "0.5",
    placeholder: "e.g. 15",
    value: ohPct,
    onChange: e => setOhPct(e.target.value),
    onKeyDown: e => {
      if (e.key === 'Enter') applyOverhead();
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "suffix"
  }, "%"))), /*#__PURE__*/React.createElement("button", {
    className: "btn-apply",
    onClick: applyOverhead,
    disabled: ohPct === '' || isNaN(parseFloat(ohPct))
  }, "Apply Overhead")), /*#__PURE__*/React.createElement("p", {
    className: "card-sub",
    style: {
      marginTop: 14
    }
  }, "Overhead Cost = Revenue \xD7 (overhead % \xF7 100), added to cost. Adjusted Profit, Adjusted Margin %, the margin flag, the KPI cards and the chart above all recalculate live. Values persist for this session only.")), /*#__PURE__*/React.createElement("div", {
    className: "oh-applied"
  }, /*#__PURE__*/React.createElement("p", {
    className: "oh-applied-title"
  }, "Applied Overheads (", appliedList.length, ")"), appliedList.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "oh-empty"
  }, "No overhead applied yet.", /*#__PURE__*/React.createElement("br", null), "Set one on the left to see it here.") : appliedList.map(it => /*#__PURE__*/React.createElement("div", {
    className: "oh-item",
    key: it.key
  }, /*#__PURE__*/React.createElement("span", {
    className: "nm"
  }, it.client, /*#__PURE__*/React.createElement("span", {
    className: "mo"
  }, it.monthLabel)), /*#__PURE__*/React.createElement("span", {
    className: "op"
  }, pct(it.pct)), /*#__PURE__*/React.createElement("span", {
    className: "oc"
  }, eur(it.cost)), /*#__PURE__*/React.createElement("button", {
    className: "oh-rm",
    title: "Remove",
    onClick: () => removeOverhead(it.key)
  }, "\xD7"))))))));
}
window.Tab1 = Tab1;
})(); } catch (e) { __ds_ns.__errors.push({ path: "dashboard/tab1.jsx", error: String((e && e.message) || e) }); }

// dashboard/tab2.jsx
try { (() => {
/* ============================================================
   TAB 2 — Contract Performance
   ============================================================ */

function Tab2({
  filters
}) {
  const {
    region,
    entityValue,
    fromIdx,
    toIdx
  } = filters;
  const lo = Math.min(fromIdx, toIdx),
    hi = Math.max(fromIdx, toIdx);
  const projects = DATA.projects.filter(p => (region === 'All' || p.region === region) && (entityValue === 'All' || p.project === entityValue)).map(p => {
    const attSlice = p.monthly.slice(lo, hi + 1);
    const tgt = p.hasTarget ? p.monthlyTarget.slice(lo, hi + 1).reduce((s, v) => s + v, 0) : 0;
    const act = p.monthlyActual.slice(lo, hi + 1).reduce((s, v) => s + v, 0);
    const leak = p.hasTarget ? p.monthlyLeak.slice(lo, hi + 1).reduce((s, v) => s + v, 0) : 0;
    const attainInRange = p.hasTarget && tgt ? act / tgt * 100 : null;
    return {
      ...p,
      attSlice,
      tgtRange: tgt,
      actRange: act,
      leakRange: leak,
      varRange: act - tgt,
      attainInRange
    };
  });
  const targeted = projects.filter(p => p.hasTarget);
  const totalTarget = targeted.reduce((s, p) => s + p.tgtRange, 0) || 1;
  const totalActual = targeted.reduce((s, p) => s + p.actRange, 0);
  const portfolioAttain = totalActual / totalTarget * 100;
  const onTrack = targeted.filter(p => p.attainInRange >= 90).length;
  const totalLeak = targeted.reduce((s, p) => s + p.leakRange, 0);
  const avgMargin = projects.length ? projects.reduce((s, p) => s + p.grossMarginPct, 0) / projects.length : 0;
  const avgMarginFlag = marginFlag(avgMargin, true);
  const gaugeColor = portfolioAttain >= 90 ? '#16A34A' : portfolioAttain >= 75 ? '#FEBE00' : '#DC2626';
  const monthsInRange = MONTHS.slice(lo, hi + 1);
  const trend = monthsInRange.map((m, i) => {
    const t = targeted.reduce((s, p) => s + p.monthlyTarget[lo + i], 0) || 1;
    const a = targeted.reduce((s, p) => s + p.monthlyActual[lo + i], 0);
    return a / t * 100;
  });

  // heatmap rows (unavailable -> disabled, approximate -> warn)
  const heatRows = projects.map(p => ({
    label: p.project,
    values: p.attSlice,
    warn: p.confidence === 'approximate',
    disabled: !p.hasTarget
  }));

  // waterfall: start = total target, steps = each project variance (sorted largest negative first), end = total actual
  const waterfallSteps = targeted.map(p => ({
    label: `${p.project}: ${p.varRange >= 0 ? '+' : ''}${kEur(p.varRange)}`,
    value: p.varRange
  })).sort((a, b) => a.value - b.value);
  const portfolioVar = totalActual - totalTarget;
  const portfolioVarPct = portfolioVar / totalTarget * 100;
  const columns = [{
    key: 'project',
    label: 'Project',
    render: r => /*#__PURE__*/React.createElement("span", {
      className: "cell-strong"
    }, r.project, r.confidence === 'approximate' && /*#__PURE__*/React.createElement("span", {
      className: "warn-ico",
      title: "Approximate target"
    }, "\u26A0"))
  }, {
    key: 'client',
    label: 'Client'
  }, {
    key: 'billing',
    label: 'Billing Basis',
    render: r => /*#__PURE__*/React.createElement("span", {
      className: "tag"
    }, r.billing)
  }, {
    key: 'status',
    label: 'Status',
    render: r => /*#__PURE__*/React.createElement("span", {
      className: 'tag ' + (r.status === 'Active' ? 'tag-active' : 'tag-completed')
    }, r.status)
  }, {
    key: 'tgtRange',
    label: 'Target Rev.',
    numeric: true,
    render: r => r.hasTarget ? eur(r.tgtRange) : /*#__PURE__*/React.createElement("span", {
      style: {
        fontStyle: 'italic',
        color: 'var(--muted)'
      }
    }, "N/A")
  }, {
    key: 'actRange',
    label: 'Actual Rev.',
    numeric: true,
    render: r => /*#__PURE__*/React.createElement("span", {
      className: "cell-dual"
    }, /*#__PURE__*/React.createElement("span", null, eur(r.actRange)), /*#__PURE__*/React.createElement("span", {
      className: "cell-usd"
    }, usd(r.actRange)))
  }, {
    key: 'varRange',
    label: 'Variance',
    numeric: true,
    render: r => r.hasTarget ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700,
        color: r.varRange >= 0 ? '#15803D' : '#DC2626'
      }
    }, (r.varRange >= 0 ? '+' : '') + eur(r.varRange)) : '—'
  }, {
    key: 'attainInRange',
    label: 'Attainment %',
    numeric: true,
    sortValue: r => r.attainInRange == null ? -1 : r.attainInRange,
    render: r => r.hasTarget ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700,
        color: heatColor(r.attainInRange)
      }
    }, pct(r.attainInRange, 0)) : '—'
  }, {
    key: 'leakFlag',
    label: 'Leakage',
    sortable: false,
    render: r => /*#__PURE__*/React.createElement(FlagPill, {
      flag: r.leakFlag
    })
  }, {
    key: 'confidence',
    label: 'Confidence',
    render: r => /*#__PURE__*/React.createElement("span", {
      className: 'tag ' + r.confidenceMeta.cls
    }, r.confidenceMeta.label)
  }, {
    key: 'grossMarginPct',
    label: 'Margin %',
    numeric: true,
    render: r => /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700,
        color: r.flag.color
      }
    }, pct(r.grossMarginPct))
  }];
  function rowClass(r) {
    if (!r.hasTarget) return 'row-unavail';
    if (r.confidence === 'approximate') return 'row-approx';
    return '';
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row kpi-4"
  }, /*#__PURE__*/React.createElement(KpiCard, {
    label: "Portfolio Attainment",
    value: pct(portfolioAttain, 0),
    valueColor: gaugeColor,
    accent: gaugeColor,
    sub: "Actual vs target, weighted"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 4,
      display: 'flex',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Gauge, {
    value: portfolioAttain,
    color: gaugeColor,
    size: 130
  }))), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Projects On Track",
    value: `${onTrack} of ${targeted.length}`,
    accent: "#16A34A",
    sub: "Attainment \u2265 90%"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 10,
      borderRadius: 6,
      background: '#EFEFEF',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${targeted.length ? onTrack / targeted.length * 100 : 0}%`,
      height: '100%',
      background: '#16A34A'
    }
  })))), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Total Contract Leakage",
    value: eur(totalLeak),
    sub: usd(totalLeak),
    accent: "#FEBE00",
    valueColor: totalLeak > 50000 ? '#B91C1C' : undefined
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-sub",
    style: {
      marginTop: 'auto',
      paddingTop: 12
    }
  }, "Revenue left on the table vs target")), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Average Project Margin",
    value: pct(avgMargin),
    valueColor: avgMarginFlag.color,
    accent: avgMarginFlag.color,
    sub: `Across ${projects.length} projects`
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement(FlagPill, {
    flag: avgMarginFlag
  })))), /*#__PURE__*/React.createElement("div", {
    className: "row c-50-50"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Attainment by Project",
    sub: "Monthly attainment \u2014 hover a cell for the exact value \xB7 \u26A0 = approximate target"
  }, /*#__PURE__*/React.createElement(HeatMap, {
    rows: heatRows,
    cols: monthsInRange.map(m => m.short)
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Monthly Attainment Trend",
    sub: "Portfolio-level, target line at 90%"
  }, /*#__PURE__*/React.createElement(LineChart, {
    xLabels: monthsInRange.map(m => m.label),
    series: [{
      name: 'Attainment',
      color: '#FF5A00',
      points: trend
    }],
    yMin: 50,
    yMax: 120,
    yFormat: v => v.toFixed(0) + '%',
    refLine: {
      value: 90,
      label: 'Target 90%'
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Variance Breakdown by Project",
    sub: "Waterfall from total target to total actual \u2014 green = above target, red = below (biggest shortfalls first)"
  }, /*#__PURE__*/React.createElement(Waterfall, {
    start: {
      label: 'Total Target',
      value: totalTarget
    },
    end: {
      label: 'Total Actual',
      value: totalActual
    },
    steps: waterfallSteps,
    valueFormat: v => kEur(v)
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 14,
      fontSize: 14,
      fontWeight: 700,
      color: portfolioVar >= 0 ? '#15803D' : '#DC2626',
      paddingLeft: 4
    }
  }, "Portfolio Variance: ", (portfolioVar >= 0 ? '+' : '') + eurusd(portfolioVar), " (", (portfolioVarPct >= 0 ? '+' : '') + pct(portfolioVarPct), ")"))), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Projects \u2014 Performance Detail",
    sub: "\u26A0 / yellow border = approximate target \xB7 gray border = no target available \xB7 click any header to sort"
  }, /*#__PURE__*/React.createElement(DataTable, {
    columns: columns,
    rows: projects,
    initialSort: {
      key: 'attainInRange',
      dir: 'asc'
    },
    rowClass: rowClass
  }))));
}
window.Tab2 = Tab2;
})(); } catch (e) { __ds_ns.__errors.push({ path: "dashboard/tab2.jsx", error: String((e && e.message) || e) }); }

// dashboard/tab3.jsx
try { (() => {
/* ============================================================
   TAB 3 — Resource Leakage
   ============================================================ */

function Tab3({
  filters
}) {
  const {
    region,
    entityValue,
    fromIdx,
    toIdx
  } = filters; // entityValue = reason key here
  const lo = Math.min(fromIdx, toIdx),
    hi = Math.max(fromIdx, toIdx);
  const [showHealthy, setShowHealthy] = useState(false);
  const inRegion = r => region === 'All' || r.region === region;
  const inReason = r => entityValue === 'All' || r.reasonKey === entityValue;

  // detail rows in scope (region + month-range + reason); table may also hide healthy
  const baseDetail = DATA.leakage.filter(r => inRegion(r) && inReason(r) && r.monthIdx >= lo && r.monthIdx <= hi);
  const tableRows = showHealthy ? baseDetail : baseDetail.filter(r => r.reasonKey !== 'ok');

  // KPI: total resource leakage
  const totalLeak = baseDetail.reduce((s, r) => s + r.leakageCost, 0);
  const leakHigh = totalLeak > 10000;

  // KPI: combined leakage (contract from Tab 2 + resource)
  const contractLeak = DATA.projects.filter(p => (region === 'All' || p.region === region) && p.hasTarget).reduce((s, p) => s + p.monthlyLeak.slice(lo, hi + 1).reduce((a, v) => a + v, 0), 0);
  const combinedTotal = contractLeak + totalLeak;

  // KPI: leakage as % of revenue
  const totalRev = DATA.accounts.filter(r => inRegion(r) && r.monthIdx >= lo && r.monthIdx <= hi).reduce((s, r) => s + r.revenue, 0) || 1;
  const leakPctRev = totalLeak / totalRev * 100;

  // KPI: affected staff (employee-level, region + reason scope)
  const empsScope = DATA.employees.filter(e => inRegion(e) && (entityValue === 'All' || e.reasonKey === entityValue));
  const affected = empsScope.filter(e => e.reasonKey !== 'ok');
  const overAllocCount = affected.filter(e => e.reasonKey === 'over_allocated' || e.reasonKey === 'over_allocated_non_billable').length;
  const nonBillableCount = affected.filter(e => e.reasonKey === 'non_billable' || e.reasonKey === 'over_allocated_non_billable').length;

  // per-employee aggregation for chart (ignores healthy toggle)
  const empAgg = {};
  baseDetail.forEach(r => {
    if (!empAgg[r.empId]) empAgg[r.empId] = {
      empId: r.empId,
      name: r.name,
      seniority: r.seniority,
      totalFte: r.totalFte,
      oa: 0,
      nb: 0
    };
    empAgg[r.empId].oa += r.overAllocCost;
    empAgg[r.empId].nb += r.nonBillableCost;
  });
  const top20 = Object.values(empAgg).filter(e => e.oa + e.nb > 0).sort((a, b) => b.oa + b.nb - (a.oa + a.nb)).slice(0, 20).map(e => ({
    label: `${e.name} (${e.seniority})`,
    oa: e.oa,
    nb: e.nb,
    totalFte: e.totalFte
  }));

  // donut by reason (exclude ok)
  const reasonAgg = {};
  baseDetail.forEach(r => {
    if (r.reasonKey === 'ok') return;
    reasonAgg[r.reasonKey] = (reasonAgg[r.reasonKey] || 0) + r.leakageCost;
  });
  const donutData = REASONS.filter(rs => rs.key !== 'ok').map(rs => ({
    label: rs.name,
    color: rs.color,
    value: reasonAgg[rs.key] || 0
  }));
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0) || 1;

  // systemic over-allocation alert — check most recent month in range
  const checkMonth = hi;
  const activeThatMonth = DATA.employees.filter(e => inRegion(e) && e.monthlyProration[checkMonth] > 0);
  const overAllocActive = activeThatMonth.filter(e => e.overAllocated);
  const systemicPct = activeThatMonth.length ? overAllocActive.length / activeThatMonth.length * 100 : 0;
  const systemic = systemicPct > 10;
  const columns = [{
    key: 'name',
    label: 'Employee',
    render: r => /*#__PURE__*/React.createElement("span", {
      className: "cell-strong"
    }, r.name)
  }, {
    key: 'seniority',
    label: 'Seniority'
  }, {
    key: 'role',
    label: 'Role'
  }, {
    key: 'project',
    label: 'Project'
  }, {
    key: 'client',
    label: 'Client'
  }, {
    key: 'allocatedFte',
    label: 'Alloc. FTE',
    numeric: true,
    render: r => r.allocatedFte.toFixed(2)
  }, {
    key: 'totalFte',
    label: 'Total FTE',
    numeric: true,
    render: r => r.totalFte.toFixed(2),
    cellClass: r => r.totalFte > 1.0 ? 'num-col fte-over' : 'num-col'
  }, {
    key: 'overAllocated',
    label: 'Over-Alloc?',
    render: r => r.overAllocated ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: '#C2410C',
        fontWeight: 700
      }
    }, "\u2713") : /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--muted)'
      }
    }, "\u2717")
  }, {
    key: 'billability',
    label: 'Billability',
    render: r => /*#__PURE__*/React.createElement("span", {
      className: 'tag ' + (r.billable ? 'tag-completed' : 'tag-warning')
    }, r.billability)
  }, {
    key: 'reasonKey',
    label: 'Leakage Reason',
    sortable: false,
    render: r => /*#__PURE__*/React.createElement("span", {
      className: 'pill ' + r.reason.cls
    }, /*#__PURE__*/React.createElement("span", {
      className: "pdot"
    }), r.reason.name)
  }, {
    key: 'monthlyCpp',
    label: 'Monthly Cost',
    numeric: true,
    render: r => /*#__PURE__*/React.createElement("span", {
      className: "cell-dual"
    }, /*#__PURE__*/React.createElement("span", null, eur(r.monthlyCpp)), /*#__PURE__*/React.createElement("span", {
      className: "cell-usd"
    }, usd(r.monthlyCpp)))
  }, {
    key: 'leakageCost',
    label: 'Leakage Cost',
    numeric: true,
    render: r => /*#__PURE__*/React.createElement("span", {
      className: "cell-dual"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700
      }
    }, eur(r.leakageCost)), /*#__PURE__*/React.createElement("span", {
      className: "cell-usd"
    }, usd(r.leakageCost)))
  }, {
    key: 'monthLabel',
    label: 'Month',
    sortValue: r => r.monthIdx
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, systemic && /*#__PURE__*/React.createElement("div", {
    className: "alert-banner"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ico"
  }, "\u26A0"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "Systemic Over-Allocation Alert:"), " ", systemicPct.toFixed(0), "% of active staff are over-allocated in ", MONTHS[checkMonth].full, ". This may indicate a company-wide resource planning issue.")), /*#__PURE__*/React.createElement("div", {
    className: "row kpi-4"
  }, /*#__PURE__*/React.createElement(KpiCard, {
    label: "Total Resource Leakage",
    value: eur(totalLeak),
    sub: usd(totalLeak),
    valueColor: leakHigh ? '#DC2626' : undefined,
    accent: leakHigh ? '#DC2626' : '#FF5A00'
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-sub",
    style: {
      marginTop: 'auto',
      paddingTop: 12
    }
  }, leakHigh ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#DC2626',
      fontWeight: 700
    }
  }, "\u26A0 Above \u20AC10,000 threshold") : 'Within threshold')), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Combined Leakage",
    value: eur(combinedTotal),
    accent: "#08283B",
    valueClass: "sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "combo-formula",
    style: {
      marginTop: 'auto',
      paddingTop: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "seg c1"
  }, "Contract ", kEur(contractLeak)), " + ", /*#__PURE__*/React.createElement("span", {
    className: "seg c2"
  }, "Resource ", kEur(totalLeak)), /*#__PURE__*/React.createElement("br", null), "= ", /*#__PURE__*/React.createElement("span", {
    className: "seg ct"
  }, "Total ", kEur(combinedTotal)))), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Leakage as % of Revenue",
    value: pct(leakPctRev),
    accent: "#FEBE00",
    sub: `Non-billable vs ${kEur(totalRev)} revenue`
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 10,
      borderRadius: 6,
      background: '#EFEFEF',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${Math.min(100, leakPctRev * 5)}%`,
      height: '100%',
      background: '#FEBE00'
    }
  })))), /*#__PURE__*/React.createElement(KpiCard, {
    label: "Affected Staff",
    value: affected.length,
    sub: `of ${empsScope.length} in scope`,
    accent: "#DC2626"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-sub",
    style: {
      marginTop: 'auto',
      paddingTop: 12
    }
  }, overAllocCount, " over-allocated, ", nonBillableCount, " non-billable"))), /*#__PURE__*/React.createElement("div", {
    className: "row c-55-45"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Top 20 Employees by Leakage Cost",
    sub: "Split by over-allocation vs non-billable cost"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stack-legend"
  }, /*#__PURE__*/React.createElement("span", {
    className: "li"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sw",
    style: {
      background: '#FF5A00'
    }
  }), "Over-Allocation Cost"), /*#__PURE__*/React.createElement("span", {
    className: "li"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sw",
    style: {
      background: '#08283B'
    }
  }), "Non-Billable Cost")), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: 440,
      overflowY: 'auto',
      paddingRight: 4
    }
  }, top20.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "empty-note"
  }, "No leakage in the current scope.") : /*#__PURE__*/React.createElement(StackedHBar, {
    data: top20,
    segKeys: [{
      key: 'oa',
      color: '#FF5A00'
    }, {
      key: 'nb',
      color: '#08283B'
    }],
    valueFormat: v => kEur(v),
    labelWidth: 155,
    tipRender: d => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "tt-title"
    }, d.label), /*#__PURE__*/React.createElement("div", {
      className: "tt-row"
    }, /*#__PURE__*/React.createElement("span", {
      className: "lab"
    }, "Total FTE"), /*#__PURE__*/React.createElement("span", {
      className: "v"
    }, d.totalFte.toFixed(2))), /*#__PURE__*/React.createElement("div", {
      className: "tt-row"
    }, /*#__PURE__*/React.createElement("span", {
      className: "sw",
      style: {
        background: '#FF5A00'
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "lab"
    }, "Over-Alloc"), /*#__PURE__*/React.createElement("span", {
      className: "v"
    }, eur(d.oa))), /*#__PURE__*/React.createElement("div", {
      className: "tt-row"
    }, /*#__PURE__*/React.createElement("span", {
      className: "sw",
      style: {
        background: '#08283B'
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "lab"
    }, "Non-Billable"), /*#__PURE__*/React.createElement("span", {
      className: "v"
    }, eur(d.nb))), /*#__PURE__*/React.createElement("div", {
      className: "tt-row"
    }, /*#__PURE__*/React.createElement("span", {
      className: "lab"
    }, "Total"), /*#__PURE__*/React.createElement("span", {
      className: "v"
    }, eurusd(d.oa + d.nb))))
  }))), /*#__PURE__*/React.createElement(Card, {
    title: "Leakage by Reason"
  }, /*#__PURE__*/React.createElement("div", {
    className: "donut-wrap"
  }, /*#__PURE__*/React.createElement(Donut, {
    data: donutData,
    size: 200,
    centerTop: kEur(donutTotal),
    centerBottom: "total"
  }), /*#__PURE__*/React.createElement("div", {
    className: "donut-legend"
  }, donutData.map((d, i) => /*#__PURE__*/React.createElement("div", {
    className: "li",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "sw",
    style: {
      background: d.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "nm"
  }, d.label), /*#__PURE__*/React.createElement("span", {
    className: "pc"
  }, (d.value / donutTotal * 100).toFixed(1), "%"), /*#__PURE__*/React.createElement("span", {
    className: "amt"
  }, eur(d.value))))), /*#__PURE__*/React.createElement("p", {
    className: "card-sub",
    style: {
      marginTop: 12,
      alignSelf: 'flex-start'
    }
  }, "Excludes employees with leakage reason = \"ok\".")))), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Resource Leakage Detail \u2014 by Employee",
    sub: "Default sort: leakage cost descending \xB7 red border = over-allocated + non-billable \xB7 orange cell = over-allocated FTE",
    right: /*#__PURE__*/React.createElement(Toggle, {
      on: showHealthy,
      onChange: setShowHealthy,
      label: "Show healthy staff"
    })
  }, /*#__PURE__*/React.createElement(DataTable, {
    columns: columns,
    rows: tableRows,
    initialSort: {
      key: 'leakageCost',
      dir: 'desc'
    },
    rowClass: r => r.reasonKey === 'over_allocated_non_billable' ? 'row-critical' : ''
  }))));
}
window.Tab3 = Tab3;
})(); } catch (e) { __ds_ns.__errors.push({ path: "dashboard/tab3.jsx", error: String((e && e.message) || e) }); }

// dashboard/ui.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* ============================================================
   UI primitives — icons, Card, KPI, Pill, Select, TopBar,
   FilterBar, sortable + paginated DataTable.
   ============================================================ */
const {
  useMemo
} = React;

/* ---------- Inline icons (lucide-style, stroke) ---------- */
function Icon({
  d,
  size = 16,
  fill = 'none',
  cls = '',
  vb = 24
}) {
  return /*#__PURE__*/React.createElement("svg", {
    className: cls,
    width: size,
    height: size,
    viewBox: `0 0 ${vb} ${vb}`,
    fill: fill,
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, d);
}
const IconCal = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 2v4M8 2v4M3 10h18"
  }))
}));
const IconChevDown = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M6 9l6 6 6-6"
  })
}));
const IconReset = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 12a9 9 0 1 0 3-6.7L3 8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 3v5h5"
  }))
}));
const IconArrowUp = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M12 19V5M5 12l7-7 7 7"
  })
}));
const IconArrowDown = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M19 12l-7 7-7-7"
  })
}));
const IconPrev = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M15 18l-6-6 6-6"
  })
}));
const IconNext = p => /*#__PURE__*/React.createElement(Icon, _extends({}, p, {
  d: /*#__PURE__*/React.createElement("path", {
    d: "M9 18l6-6-6-6"
  })
}));

/* ---------- Select ---------- */
function Select({
  value,
  onChange,
  options
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "select"
  }, /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement(IconChevDown, {
    cls: "chev",
    size: 14
  }));
}

/* ---------- Card ---------- */
function Card({
  title,
  sub,
  right,
  children,
  bodyStyle
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, (title || right) && /*#__PURE__*/React.createElement("div", {
    className: "card-head",
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("h3", {
    className: "card-title"
  }, title), sub && /*#__PURE__*/React.createElement("p", {
    className: "card-sub"
  }, sub)), right), /*#__PURE__*/React.createElement("div", {
    className: "card-body",
    style: bodyStyle
  }, children));
}

/* ---------- KPI card ---------- */
function KpiCard({
  label,
  value,
  valueColor,
  sub,
  accent = '#FF5A00',
  valueClass = '',
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "kpi"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kpi-accent",
    style: {
      background: accent
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: 'kpi-value ' + valueClass,
    style: valueColor ? {
      color: valueColor
    } : null
  }, value), sub && /*#__PURE__*/React.createElement("div", {
    className: "kpi-sub"
  }, sub), children);
}

/* ---------- Pill (margin flag) ---------- */
function FlagPill({
  flag
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: 'pill ' + flag.cls
  }, /*#__PURE__*/React.createElement("span", {
    className: "pdot"
  }), flag.label);
}

/* ---------- TopBar ---------- */
function TopBar({
  tabs,
  active,
  onTab,
  dateLabel
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "logo"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }), "AMALITECH"), /*#__PURE__*/React.createElement("div", {
    className: "tabs"
  }, tabs.map((t, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: 'tab-btn' + (active === i ? ' active' : ''),
    onClick: () => onTab(i)
  }, t))), /*#__PURE__*/React.createElement("div", {
    className: "daterange-display"
  }, /*#__PURE__*/React.createElement(IconCal, {
    cls: "cal",
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, dateLabel)));
}

/* ---------- FilterBar ---------- */
function FilterBar({
  region,
  setRegion,
  entityLabel,
  entityValue,
  setEntityValue,
  entityOptions,
  fromIdx,
  toIdx,
  setFrom,
  setTo,
  onReset
}) {
  const monthOpts = MONTHS.map(m => ({
    value: String(m.idx),
    label: m.label
  }));
  return /*#__PURE__*/React.createElement("div", {
    className: "filterbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "filter-field"
  }, /*#__PURE__*/React.createElement("span", {
    className: "filter-label"
  }, "Region"), /*#__PURE__*/React.createElement(Select, {
    value: region,
    onChange: setRegion,
    options: [{
      value: 'All',
      label: 'All Regions'
    }, ...REGIONS.map(r => ({
      value: r,
      label: r
    }))]
  })), /*#__PURE__*/React.createElement("div", {
    className: "filter-field"
  }, /*#__PURE__*/React.createElement("span", {
    className: "filter-label"
  }, entityLabel), /*#__PURE__*/React.createElement(Select, {
    value: entityValue,
    onChange: setEntityValue,
    options: entityOptions
  })), /*#__PURE__*/React.createElement("div", {
    className: "filter-field"
  }, /*#__PURE__*/React.createElement("span", {
    className: "filter-label"
  }, "From"), /*#__PURE__*/React.createElement(Select, {
    value: String(fromIdx),
    onChange: v => setFrom(Number(v)),
    options: monthOpts
  })), /*#__PURE__*/React.createElement("div", {
    className: "filter-field"
  }, /*#__PURE__*/React.createElement("span", {
    className: "filter-label"
  }, "To"), /*#__PURE__*/React.createElement(Select, {
    value: String(toIdx),
    onChange: v => setTo(Number(v)),
    options: monthOpts
  })), /*#__PURE__*/React.createElement("div", {
    className: "filter-spacer"
  }), /*#__PURE__*/React.createElement("button", {
    className: "filter-reset",
    onClick: onReset
  }, /*#__PURE__*/React.createElement(IconReset, {
    size: 14
  }), "Reset filters"));
}

/* ---------- DataTable: sortable + paginated ---------- */
function DataTable({
  columns,
  rows,
  initialSort,
  pageSize = 10,
  rowClass
}) {
  const [sort, setSort] = useState(initialSort || {
    key: columns[0].key,
    dir: 'asc'
  });
  const [page, setPage] = useState(0);
  const sorted = useMemo(() => {
    const col = columns.find(c => c.key === sort.key);
    const acc = col && col.sortValue ? col.sortValue : r => r[sort.key];
    const arr = [...rows].sort((a, b) => {
      const va = acc(a),
        vb = acc(b);
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      return String(va).localeCompare(String(vb));
    });
    if (sort.dir === 'desc') arr.reverse();
    return arr;
  }, [rows, sort, columns]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const curPage = Math.min(page, pageCount - 1);
  const slice = sorted.slice(curPage * pageSize, curPage * pageSize + pageSize);
  function toggleSort(key) {
    setSort(s => s.key === key ? {
      key,
      dir: s.dir === 'asc' ? 'desc' : 'asc'
    } : {
      key,
      dir: 'asc'
    });
    setPage(0);
  }
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "data"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    className: (c.sortable !== false ? 'sortable ' : '') + (c.numeric ? 'num-col' : ''),
    onClick: c.sortable !== false ? () => toggleSort(c.key) : undefined
  }, /*#__PURE__*/React.createElement("span", {
    className: "th-inner"
  }, c.label, c.sortable !== false && (sort.key === c.key ? sort.dir === 'asc' ? /*#__PURE__*/React.createElement(IconArrowUp, {
    cls: "sort-arrow",
    size: 12
  }) : /*#__PURE__*/React.createElement(IconArrowDown, {
    cls: "sort-arrow",
    size: 12
  }) : /*#__PURE__*/React.createElement(IconArrowDown, {
    cls: "sort-arrow idle",
    size: 12
  }))))))), /*#__PURE__*/React.createElement("tbody", null, slice.length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: columns.length
  }, /*#__PURE__*/React.createElement("div", {
    className: "empty-note"
  }, "No rows match the current filters."))), slice.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: rowClass ? rowClass(r) : ''
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    className: c.cellClass ? c.cellClass(r) : c.numeric ? 'num-col' : ''
  }, c.render ? c.render(r) : r[c.key]))))))), /*#__PURE__*/React.createElement("div", {
    className: "pager"
  }, /*#__PURE__*/React.createElement("span", null, "Showing ", slice.length ? curPage * pageSize + 1 : 0, "\u2013", curPage * pageSize + slice.length, " of ", sorted.length), /*#__PURE__*/React.createElement("div", {
    className: "pager-controls"
  }, /*#__PURE__*/React.createElement("button", {
    className: "pg-btn",
    disabled: curPage === 0,
    onClick: () => setPage(curPage - 1)
  }, /*#__PURE__*/React.createElement(IconPrev, {
    size: 14
  }), "Previous"), /*#__PURE__*/React.createElement("span", {
    className: "pg-info"
  }, "Page ", curPage + 1, " of ", pageCount), /*#__PURE__*/React.createElement("button", {
    className: "pg-btn",
    disabled: curPage >= pageCount - 1,
    onClick: () => setPage(curPage + 1)
  }, "Next", /*#__PURE__*/React.createElement(IconNext, {
    size: 14
  })))));
}
Object.assign(window, {
  Icon,
  IconCal,
  IconChevDown,
  IconReset,
  IconArrowUp,
  IconArrowDown,
  IconPrev,
  IconNext,
  Select,
  Card,
  KpiCard,
  FlagPill,
  TopBar,
  FilterBar,
  DataTable,
  Toggle
});

/* ---------- Toggle switch ---------- */
function Toggle({
  on,
  onChange,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'toggle' + (on ? ' on' : ''),
    onClick: () => onChange(!on),
    role: "switch",
    "aria-checked": on
  }, /*#__PURE__*/React.createElement("span", {
    className: "track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "knob"
  })), label);
}
window.Toggle = Toggle;
})(); } catch (e) { __ds_ns.__errors.push({ path: "dashboard/ui.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/adminPrimitives.jsx
try { (() => {
// Validata UI kit — admin primitives: filters, pagination, kebab, drawer, empty state.

function SearchInput({
  placeholder = "Search…",
  value,
  onChange,
  width
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "search",
    style: width ? {
      width
    } : {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 17,
    style: {
      color: "var(--text-secondary)"
    }
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: placeholder,
    value: value || "",
    onChange: e => onChange && onChange(e.target.value)
  }));
}

// Display-only select (kit cosmetic — opens nothing).
function SelectField({
  label,
  value,
  width
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "selectf",
    style: width ? {
      width
    } : {}
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "selectf-label"
  }, label), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "selectf-btn"
  }, /*#__PURE__*/React.createElement("span", null, value), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 16,
    style: {
      color: "var(--text-secondary)"
    }
  })));
}
function SegToggle({
  options,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "segtoggle"
  }, options.map(o => /*#__PURE__*/React.createElement("button", {
    key: o,
    type: "button",
    className: "segtoggle-btn" + (o === value ? " on" : ""),
    onClick: () => onChange && onChange(o)
  }, o)));
}
function Pagination({
  from = 1,
  to = 5,
  total = 42,
  pages = 9,
  current = 1
}) {
  const nums = pages <= 4 ? Array.from({
    length: pages
  }, (_, i) => i + 1) : [1, 2, 3, "…", pages];
  return /*#__PURE__*/React.createElement("div", {
    className: "pager"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pager-count"
  }, "Showing ", from, " to ", to, " of ", total, " entries"), /*#__PURE__*/React.createElement("div", {
    className: "pager-ctrls"
  }, /*#__PURE__*/React.createElement("button", {
    className: "pg-arrow",
    "aria-label": "Previous"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-left",
    size: 16
  })), nums.map((n, i) => n === "…" ? /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "pg-ellipsis"
  }, "\u2026") : /*#__PURE__*/React.createElement("button", {
    key: i,
    className: "pg-num" + (n === current ? " on" : "")
  }, n)), /*#__PURE__*/React.createElement("button", {
    className: "pg-arrow",
    "aria-label": "Next"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16
  }))));
}
function Kebab() {
  return /*#__PURE__*/React.createElement("button", {
    className: "kebab",
    "aria-label": "Actions"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "more-vertical",
    size: 18
  }));
}
function EmptyState({
  icon = "inbox",
  title,
  body
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, /*#__PURE__*/React.createElement("div", {
    className: "empty-ic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 30
  })), /*#__PURE__*/React.createElement("p", {
    className: "empty-title"
  }, title), body && /*#__PURE__*/React.createElement("p", {
    className: "empty-body"
  }, body));
}

// Right-anchored slide-over drawer.
function Drawer({
  open,
  title,
  subtitle,
  onClose,
  footer,
  children
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "drawer-scrim",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "drawer",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "drawer-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "drawer-title"
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    className: "drawer-sub"
  }, subtitle)), /*#__PURE__*/React.createElement("button", {
    className: "drawer-x",
    onClick: onClose,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    className: "drawer-body"
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "drawer-foot"
  }, footer)));
}

// Form field wrappers for drawers/forms.
function TextField({
  label,
  value,
  placeholder,
  hint,
  mono
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "ff"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ff-label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "ff-input"
  }, /*#__PURE__*/React.createElement("input", {
    className: mono ? "mono" : "",
    defaultValue: value,
    placeholder: placeholder
  })), hint && /*#__PURE__*/React.createElement("span", {
    className: "ff-hint"
  }, hint));
}
function SelectFieldForm({
  label,
  value,
  hint
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "ff"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ff-label"
  }, label), /*#__PURE__*/React.createElement("span", {
    className: "ff-input ff-select"
  }, /*#__PURE__*/React.createElement("span", null, value), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 16,
    style: {
      color: "var(--text-secondary)"
    }
  })), hint && /*#__PURE__*/React.createElement("span", {
    className: "ff-hint"
  }, hint));
}

// Centered modal dialog.
function Modal({
  open,
  title,
  subtitle,
  onClose,
  footer,
  tone,
  children
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-scrim",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-head"
  }, tone === "warning" && /*#__PURE__*/React.createElement("span", {
    className: "modal-ic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert-triangle",
    size: 22
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "modal-title"
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    className: "modal-sub"
  }, subtitle))), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    className: "modal-foot"
  }, footer)));
}

// Read-only credential field with copy / reveal affordances.
function CopyField({
  label,
  value,
  secret
}) {
  const [shown, setShown] = React.useState(!secret);
  return /*#__PURE__*/React.createElement("div", {
    className: "ff"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ff-label"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "copyfield"
  }, /*#__PURE__*/React.createElement("span", {
    className: "copyfield-val mono"
  }, shown ? value : "•".repeat(Math.min(value.length, 22))), secret && /*#__PURE__*/React.createElement("button", {
    className: "copyfield-btn",
    onClick: () => setShown(!shown),
    "aria-label": "Reveal"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: shown ? "eye-off" : "eye",
    size: 17
  })), /*#__PURE__*/React.createElement("button", {
    className: "copyfield-btn",
    "aria-label": "Copy"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "copy",
    size: 17
  }))));
}

// Toast notification (auto-styled by tone).
function Toast({
  open,
  tone = "success",
  title,
  body,
  onClose
}) {
  if (!open) return null;
  const icon = tone === "success" ? "check-circle" : tone === "warning" ? "alert-triangle" : "info";
  return /*#__PURE__*/React.createElement("div", {
    className: "toast toast-" + tone
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 20
  }), /*#__PURE__*/React.createElement("div", {
    className: "toast-text"
  }, /*#__PURE__*/React.createElement("div", {
    className: "toast-title"
  }, title), body && /*#__PURE__*/React.createElement("div", {
    className: "toast-body"
  }, body)), /*#__PURE__*/React.createElement("button", {
    className: "toast-x",
    onClick: onClose,
    "aria-label": "Dismiss"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 16
  })));
}

// Segmented password-strength meter.
function StrengthMeter({
  score = 2,
  label = "Fair"
}) {
  const colors = ["var(--danger)", "var(--orange)", "var(--orange)", "var(--success)"];
  return /*#__PURE__*/React.createElement("div", {
    className: "strength"
  }, /*#__PURE__*/React.createElement("div", {
    className: "strength-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ff-label"
  }, "Password strength"), /*#__PURE__*/React.createElement("span", {
    className: "strength-label",
    style: {
      color: colors[score - 1] || "var(--text-secondary)"
    }
  }, label)), /*#__PURE__*/React.createElement("div", {
    className: "strength-bars"
  }, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "strength-bar",
    style: {
      background: i < score ? colors[score - 1] : "#E4E2DA"
    }
  }))));
}
Object.assign(window, {
  SearchInput,
  SelectField,
  SegToggle,
  Pagination,
  Kebab,
  EmptyState,
  Drawer,
  TextField,
  SelectFieldForm,
  Modal,
  CopyField,
  Toast,
  StrengthMeter
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/adminPrimitives.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/app.jsx
try { (() => {
// Validata UI kit — root app with role-aware view routing.
const {
  useState,
  useEffect
} = React;
const DEFAULT_VIEW = {
  admin: "a-dashboard",
  instructor: "i-dashboard"
};
function App() {
  const [role, setRole] = useState(null); // null = logged out
  const [auth, setAuth] = useState("login"); // "login" | "setpw"
  const [view, setView] = useState("a-dashboard");
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  const validateDone = target => {
    setView(target);
    setToast({
      tone: "warning",
      title: "Validation complete",
      body: "43 rows accepted · 5 rejected. Review the rejected rows below."
    });
  };
  if (!role) {
    if (auth === "setpw") {
      return /*#__PURE__*/React.createElement(SetPassword, {
        onContinue: () => {
          setRole("admin");
          setView("a-dashboard");
          setAuth("login");
        },
        onBack: () => setAuth("login")
      });
    }
    return /*#__PURE__*/React.createElement(Login, {
      onSignIn: r => {
        setRole(r);
        setView(DEFAULT_VIEW[r]);
      },
      onFirstLogin: () => setAuth("setpw")
    });
  }
  const nav = ALL_NAV_FOR(role);
  const crumb = (nav.find(n => n.id === view) || {}).crumb || "Dashboard";
  let screen;
  // ---- Admin ----
  if (view === "a-dashboard") screen = /*#__PURE__*/React.createElement(Dashboard, {
    onOpenReport: () => setView("a-reports")
  });else if (view === "a-cohorts") screen = /*#__PURE__*/React.createElement(Cohorts, {
    onBulkSetup: () => setView("a-bulksetup")
  });else if (view === "a-bulksetup") screen = /*#__PURE__*/React.createElement(BulkSetup, null);else if (view === "a-refdata") screen = /*#__PURE__*/React.createElement(ReferenceData, null);else if (view === "a-learners") screen = /*#__PURE__*/React.createElement(LearnerRoster, null);else if (view === "a-users") screen = /*#__PURE__*/React.createElement(UserManagement, null);else if (view === "a-reports") screen = /*#__PURE__*/React.createElement(AuditLog, {
    onOpenReport: () => setView("a-report")
  });else if (view === "a-report") screen = /*#__PURE__*/React.createElement(Report, null);else if (view === "a-powerbi") screen = /*#__PURE__*/React.createElement(PowerBI, null);else if (view === "a-settings") screen = /*#__PURE__*/React.createElement(SettingsScreen, {
    onOpenPowerBI: () => setView("a-powerbi")
  });
  // ---- Instructor ----
  else if (view === "i-dashboard") screen = /*#__PURE__*/React.createElement(InstructorDashboard, {
    onUpload: () => setView("i-upload"),
    onOpenReport: () => setView("i-report")
  });else if (view === "i-template") screen = /*#__PURE__*/React.createElement(DownloadTemplate, null);else if (view === "i-upload") screen = /*#__PURE__*/React.createElement(Upload, {
    onValidate: () => validateDone("i-report")
  });else if (view === "i-myuploads") screen = /*#__PURE__*/React.createElement(MyUploads, {
    onOpenReport: () => setView("i-report")
  });else if (view === "i-report") screen = /*#__PURE__*/React.createElement(Report, null);
  // ---- Stubs (planned screens) ----
  else screen = /*#__PURE__*/React.createElement(Placeholder, {
    role: role,
    view: view
  });

  // Detail / secondary views aren't nav items — keep the parent nav highlighted.
  const detailMap = {
    "i-report": "i-myuploads",
    "a-report": "a-reports",
    "a-bulksetup": "a-cohorts",
    "a-powerbi": "a-settings"
  };
  const activeNav = detailMap[view] || view;
  const crumbMap = {
    "i-report": "Validation report",
    "a-report": "Validation report",
    "a-bulksetup": "Bulk setup",
    "a-powerbi": "Power BI connection"
  };
  const navCrumb = crumbMap[view] || crumb;
  return /*#__PURE__*/React.createElement(AppShell, {
    role: role,
    active: activeNav,
    crumb: navCrumb,
    onNavigate: setView,
    onLogout: () => {
      setRole(null);
      setToast(null);
    }
  }, screen, /*#__PURE__*/React.createElement(Toast, {
    open: !!toast,
    tone: toast ? toast.tone : "success",
    title: toast ? toast.title : "",
    body: toast ? toast.body : "",
    onClose: () => setToast(null)
  }));
}
function Placeholder({
  role,
  view
}) {
  const meta = ALL_NAV_FOR(role).find(n => n.id === view) || {};
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, meta.label)), /*#__PURE__*/React.createElement(EmptyState, {
    icon: meta.icon || "square",
    title: "This screen is not part of the UI kit sample.",
    body: "See the design-system gap analysis for scope."
  }));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/auditLog.jsx
try { (() => {
// Validata UI kit — Audit Log (admin "Reports"): per-upload audit.

const AUDIT = [{
  id: "UP-8F2A9…",
  who: "Dr. Alan Grant",
  file: "lab_results_q3.csv",
  when: "Oct 24, 09:41 AM",
  rows: "1,240",
  acc: "1,240",
  rej: "0",
  status: ["success", "Completed"]
}, {
  id: "UP-4D7E2…",
  who: "Dr. Ellie Sattler",
  file: "botany_extract_v2.xlsx",
  when: "Oct 23, 14:22 PM",
  rows: "850",
  acc: "812",
  rej: "38",
  status: ["warning", "Partial"]
}, {
  id: "UP-9C1B4…",
  who: "Dr. Ian Malcolm",
  file: "chaos_theory_sim_final.csv",
  when: "Oct 23, 11:05 AM",
  rows: "5,000",
  acc: "0",
  rej: "5,000",
  status: ["danger", "Failed"]
}, {
  id: "UP-2A5F8…",
  who: "Dr. Henry Wu",
  file: "genetics_batch_04.csv",
  when: "Oct 22, 16:45 PM",
  rows: "3,200",
  acc: "3,200",
  rej: "0",
  status: ["success", "Completed"]
}, {
  id: "UP-7E3B1…",
  who: "Dr. Alan Grant",
  file: "excavation_logs_site_b.xlsx",
  when: "Oct 21, 08:15 AM",
  rows: "450",
  acc: "448",
  rej: "2",
  status: ["warning", "Partial"]
}];
function CountChip({
  value,
  tone
}) {
  const map = {
    acc: {
      bg: "var(--success-bg)",
      fg: "var(--success)"
    },
    rej: {
      bg: "var(--danger-bg)",
      fg: "var(--danger)"
    },
    zero: {
      bg: "#EFEEE9",
      fg: "var(--text-secondary)"
    }
  };
  const key = value === "0" ? "zero" : tone;
  const c = map[key];
  return /*#__PURE__*/React.createElement("span", {
    className: "count-chip",
    style: {
      background: c.bg,
      color: c.fg
    }
  }, value);
}
function AuditLog({
  onOpenReport
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "Audit log")), /*#__PURE__*/React.createElement("div", {
    className: "card card-pad filterbar"
  }, /*#__PURE__*/React.createElement(SelectField, {
    label: "Date Range",
    value: "Oct 1, 2023 \u2013 Oct 31, 2023"
  }), /*#__PURE__*/React.createElement(SelectField, {
    label: "Instructor",
    value: "All Instructors"
  }), /*#__PURE__*/React.createElement(SelectField, {
    label: "Status",
    value: "All"
  }), /*#__PURE__*/React.createElement("div", {
    className: "selectf",
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "selectf-label"
  }, "Search"), /*#__PURE__*/React.createElement(SearchInput, {
    placeholder: "Search by ID or Filename"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap",
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Upload ID"), /*#__PURE__*/React.createElement("th", null, "Instructor"), /*#__PURE__*/React.createElement("th", null, "Filename"), /*#__PURE__*/React.createElement("th", null, "Uploaded at"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right"
    }
  }, "Total rows"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "center"
    }
  }, "Accepted"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "center"
    }
  }, "Rejected"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right"
    }
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, AUDIT.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.id
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      color: "var(--text-secondary)"
    }
  }, r.id), /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: 500
    }
  }, r.who), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.file), /*#__PURE__*/React.createElement("td", {
    style: {
      color: "var(--text-secondary)"
    }
  }, r.when), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: "right"
    }
  }, r.rows), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(CountChip, {
    value: r.acc,
    tone: "acc"
  })), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(CountChip, {
    value: r.rej,
    tone: "rej"
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "pill-dot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      background: r.status[0] === "success" ? "var(--success)" : r.status[0] === "warning" ? "var(--warning)" : "var(--danger)"
    }
  }), r.status[1])), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "link",
    onClick: onOpenReport
  }, "Details")))))), /*#__PURE__*/React.createElement(Pagination, {
    from: 1,
    to: 5,
    total: 42,
    pages: 9,
    current: 1
  })));
}
Object.assign(window, {
  AuditLog
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/auditLog.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/bulkSetup.jsx
try { (() => {
// Validata UI kit — Bulk Setup CSV (admin): stand up a whole cohort hierarchy.

const STRUCTURE_COLS = ["cohort_name", "specialization_name", "specialization_code", "module_name", "module_sequence", "lab_title", "lab_max_score"];
function BulkSetup() {
  const [over, setOver] = React.useState(false);
  const [file, setFile] = React.useState(null);
  const [showCols, setShowCols] = React.useState(false);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "crumbs",
    style: {
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, "Cohorts"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 14
  }), /*#__PURE__*/React.createElement("span", {
    className: "cur"
  }, "Bulk setup")), /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "Bulk setup"))), /*#__PURE__*/React.createElement("div", {
    className: "bulk-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card card-pad bulk-upload"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bulk-cardhead"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file-up",
    size: 20,
    style: {
      color: "var(--orange-deep)"
    }
  }), /*#__PURE__*/React.createElement("h2", {
    className: "sec-title"
  }, "Upload structure CSV")), /*#__PURE__*/React.createElement("div", {
    className: "dropzone" + (over ? " over" : ""),
    onDragOver: e => {
      e.preventDefault();
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: e => {
      e.preventDefault();
      setOver(false);
      setFile("cohort_8_structure.csv");
    },
    onClick: () => setFile("cohort_8_structure.csv")
  }, /*#__PURE__*/React.createElement("div", {
    className: "dz-icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "upload-cloud",
    size: 32
  })), file ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "dz-title"
  }, file), /*#__PURE__*/React.createElement("p", {
    className: "dz-sub"
  }, "Ready to validate the cohort hierarchy")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "dz-title"
  }, "Drag your CSV here or click to browse"), /*#__PURE__*/React.createElement("p", {
    className: "dz-sub"
  }, "Maximum file size: 10MB. Must be .csv format."))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "play",
    disabled: !file,
    style: {
      width: "100%"
    }
  }, "Validate & import")), /*#__PURE__*/React.createElement("div", {
    className: "bulk-right"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card card-pad"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bulk-cardhead"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file-text",
    size: 20,
    style: {
      color: "var(--text-secondary)"
    }
  }), /*#__PURE__*/React.createElement("h2", {
    className: "sec-title"
  }, "Download the structure template")), /*#__PURE__*/React.createElement("p", {
    className: "page-sub",
    style: {
      margin: "10px 0 16px"
    }
  }, "Ensure your import goes smoothly by starting with our formatted CSV template. It includes all required headers and sample data formatting."), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "download",
    style: {
      width: "100%"
    }
  }, "Download template"), /*#__PURE__*/React.createElement("button", {
    className: "bulk-cols-toggle",
    onClick: () => setShowCols(!showCols)
  }, /*#__PURE__*/React.createElement("span", null, "VIEW REQUIRED COLUMNS"), /*#__PURE__*/React.createElement(Icon, {
    name: showCols ? "chevron-up" : "chevron-down",
    size: 16
  })), showCols && /*#__PURE__*/React.createElement("div", {
    className: "bulk-cols"
  }, STRUCTURE_COLS.map(c => /*#__PURE__*/React.createElement("span", {
    key: c,
    className: "rule-id"
  }, c)))), /*#__PURE__*/React.createElement("div", {
    className: "callout"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 22,
    color: "#A83900"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "callout-title",
    style: {
      fontSize: 15
    }
  }, "Data validation rules"), /*#__PURE__*/React.createElement("p", {
    className: "callout-body"
  }, "Empty fields in required columns will trigger a validation error. Ensure date formats exactly match the YYYY-MM-DD standard before importing."))))));
}
Object.assign(window, {
  BulkSetup
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/bulkSetup.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/cohorts.jsx
try { (() => {
// Validata UI kit — Cohorts (admin): list + create/edit drawer.

const COHORTS = [{
  name: "Cohort 4",
  start: "2023-01-15",
  end: "2023-06-30",
  specs: 12,
  status: ["warning", "Active"]
}, {
  name: "Cohort 5",
  start: "2023-02-01",
  end: "2023-07-31",
  specs: 8,
  status: ["success", "Completed"]
}, {
  name: "Cohort 6",
  start: "2023-03-01",
  end: "2023-08-31",
  specs: 15,
  status: ["warning", "Pending"]
}, {
  name: "Cohort 7",
  start: "2023-04-15",
  end: "2023-10-15",
  specs: 10,
  status: ["warning", "Active"]
}];
function Cohorts({
  onBulkSetup
}) {
  const [open, setOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "crumbs",
    style: {
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, "Admin"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 14
  }), /*#__PURE__*/React.createElement("span", {
    className: "cur"
  }, "Cohorts")), /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "Cohorts")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "upload",
    onClick: onBulkSetup
  }, "Bulk setup"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "plus",
    onClick: () => setOpen(true)
  }, "Create new cohort"))), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Cohort Name"), /*#__PURE__*/React.createElement("th", null, "Start Date"), /*#__PURE__*/React.createElement("th", null, "End Date"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right"
    }
  }, "Specializations"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "center"
    }
  }, "Status"), /*#__PURE__*/React.createElement("th", null))), /*#__PURE__*/React.createElement("tbody", null, COHORTS.map(c => /*#__PURE__*/React.createElement("tr", {
    key: c.name
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: 600
    }
  }, c.name), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      color: "var(--text-secondary)"
    }
  }, c.start), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      color: "var(--text-secondary)"
    }
  }, c.end), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: "right"
    }
  }, c.specs), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement(Pill, {
    tone: c.status[0]
  }, c.status[1])), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: "right",
      width: 48
    }
  }, /*#__PURE__*/React.createElement(Kebab, null)))))), /*#__PURE__*/React.createElement(Pagination, {
    from: 1,
    to: 4,
    total: 4,
    pages: 1,
    current: 1
  })), /*#__PURE__*/React.createElement(Drawer, {
    open: open,
    title: "Create new cohort",
    subtitle: "A cohort is a time-bound group progressing together.",
    onClose: () => setOpen(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setOpen(false)
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      onClick: () => setOpen(false)
    }, "Create cohort"))
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "Cohort name",
    placeholder: "e.g. Cohort 8 \u2014 Spring 2026"
  }), /*#__PURE__*/React.createElement("div", {
    className: "ff-row"
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "Start date",
    placeholder: "YYYY-MM-DD",
    mono: true
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "End date",
    placeholder: "YYYY-MM-DD",
    mono: true
  })), /*#__PURE__*/React.createElement(SelectFieldForm, {
    label: "Status",
    value: "Pending",
    hint: "Soft-archival flag \u2014 set to Active when the cohort begins."
  })));
}
Object.assign(window, {
  Cohorts
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/cohorts.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/dashboard.jsx
try { (() => {
// Validata UI kit — Admin Dashboard.

const RECENT = [{
  who: "Sarah Jenkins",
  file: "lab_res_W1.csv",
  acc: 45,
  rej: 0,
  status: ["success", "Completed"]
}, {
  who: "Marcus Chen",
  file: "wk3_data_raw.xlsx",
  acc: 38,
  rej: 12,
  status: ["warning", "Partial"]
}, {
  who: "Elena Rodriguez",
  file: "cohort_B_vals.csv",
  acc: 52,
  rej: 0,
  status: ["success", "Completed"]
}, {
  who: "Marcus Chen",
  file: "wk2_data_fix.csv",
  acc: 48,
  rej: 2,
  status: ["warning", "Partial"]
}, {
  who: "David Kim",
  file: "results_final_1.xlsx",
  acc: 30,
  rej: 0,
  status: ["success", "Completed"]
}];
const ATTENTION = [{
  who: "James Wilson",
  file: "bio_lab_04_error.csv",
  pct: "82% Rejected",
  detail: "4 Accepted / 18 Rejected"
}, {
  who: "Anita Patel",
  file: "chem_w2_res.xlsx",
  pct: "60% Rejected",
  detail: "20 Accepted / 30 Rejected"
}];
function Dashboard({
  onOpenReport
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "Dashboard"), /*#__PURE__*/React.createElement("p", {
    className: "page-sub"
  }, "Overview of current validation system status."))), /*#__PURE__*/React.createElement("div", {
    className: "stats"
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Cohorts",
    value: "12",
    chipIcon: "graduation-cap",
    chipBg: "#FFE9E3",
    chipFg: "#A83900",
    footDot: "#1A6B3C",
    footText: "3 Active"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Learners",
    value: "48",
    chipIcon: "user",
    chipBg: "#CAE6FF",
    chipFg: "#08283B",
    footDot: "#1A6B3C",
    footText: "44 Active \xB7 4 Archived"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Instructors",
    value: "5",
    chipIcon: "id-card",
    chipBg: "#FDF0D5",
    chipFg: "#7A4A00",
    footDot: "#1A6B3C",
    footText: "3 Active"
  })), /*#__PURE__*/React.createElement("div", {
    className: "dash-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "sec-title"
  }, "Recent uploads"), /*#__PURE__*/React.createElement("button", {
    className: "link",
    onClick: onOpenReport
  }, "View all")), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap",
    style: {
      border: "none",
      borderRadius: 0,
      boxShadow: "none"
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Instructor"), /*#__PURE__*/React.createElement("th", null, "File"), /*#__PURE__*/React.createElement("th", null, "Accepted"), /*#__PURE__*/React.createElement("th", null, "Rejected"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, RECENT.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    onClick: onOpenReport,
    style: {
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: 500
    }
  }, r.who), /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.file), /*#__PURE__*/React.createElement("td", null, r.acc), /*#__PURE__*/React.createElement("td", {
    style: {
      color: r.rej > 0 ? "var(--danger)" : "inherit",
      fontWeight: r.rej > 0 ? 600 : 400
    }
  }, r.rej), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Pill, {
    tone: r.status[0]
  }, r.status[1])))))))), /*#__PURE__*/React.createElement("div", {
    className: "card card-pad attention"
  }, /*#__PURE__*/React.createElement("div", {
    className: "att-head"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert-triangle",
    size: 22,
    color: "#A83900"
  }), /*#__PURE__*/React.createElement("h2", {
    className: "sec-title"
  }, "Attention required")), /*#__PURE__*/React.createElement("p", {
    className: "att-intro"
  }, "The following recent uploads have a rejection rate greater than 50%. Manual intervention may be required."), ATTENTION.map((a, i) => /*#__PURE__*/React.createElement("div", {
    className: "att-item",
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "att-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "att-who"
  }, "Instructor: ", a.who), /*#__PURE__*/React.createElement(Pill, {
    tone: "danger"
  }, a.pct)), /*#__PURE__*/React.createElement("div", {
    className: "mono att-file"
  }, a.file), /*#__PURE__*/React.createElement("div", {
    className: "att-foot"
  }, /*#__PURE__*/React.createElement("span", null, a.detail), /*#__PURE__*/React.createElement("button", {
    className: "link",
    onClick: onOpenReport
  }, "View details \u2192")))))));
}
Object.assign(window, {
  Dashboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/dashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/downloadTemplate.jsx
try { (() => {
// Validata UI kit — Download Template (instructor).

const LEGEND = [{
  lab: "CELL_OSMOSIS_V1",
  max: 100
}, {
  lab: "CELL_MITOSIS_OBS",
  max: 50
}, {
  lab: "CELL_ENZYME_KINETICS",
  max: 120
}, {
  lab: "GEN_PUNNETT_SQUARE",
  max: 80
}, {
  lab: "GEN_DNA_EXTRACTION",
  max: 150
}, {
  lab: "GEN_PCR_ANALYSIS",
  max: 200
}];
const COLUMNS = [{
  name: "learner_email",
  desc: "Must match a learner's email exactly (case-insensitive).",
  req: true
}, {
  name: "lab_title",
  desc: "Exact title from the legend above.",
  req: true
}, {
  name: "score",
  desc: "Numeric score achieved. Must not exceed max score.",
  req: true
}, {
  name: "submitted_on",
  desc: "Date in YYYY-MM-DD format.",
  req: true
}, {
  name: "attempt_number",
  desc: "Integer — 1 (first) or 2 (retake).",
  req: true
}, {
  name: "graded_by",
  desc: "Optional qualitative feedback / instructor name.",
  req: false
}];
function DownloadTemplate() {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "Download template")), /*#__PURE__*/React.createElement("div", {
    className: "card card-pad tpl-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tpl-intro"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "upload-title"
  }, "Your personalised CSV template"), /*#__PURE__*/React.createElement("p", {
    className: "dz-sub",
    style: {
      textAlign: "center",
      maxWidth: 560,
      margin: "8px auto 0"
    }
  }, "This template is pre-scoped to your assigned modules. Use the exact lab titles listed in the legend below.")), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "download",
    style: {
      width: "100%"
    }
  }, "Download labs_results_template.csv"), /*#__PURE__*/React.createElement("div", {
    className: "tpl-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tpl-sec-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-title"
  }, "Template legend"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-up",
    size: 18,
    style: {
      color: "var(--text-secondary)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Module / Lab title"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right"
    }
  }, "Max score"))), /*#__PURE__*/React.createElement("tbody", null, LEGEND.map(l => /*#__PURE__*/React.createElement("tr", {
    key: l.lab
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: "center"
    }
  }, l.lab), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: "right"
    }
  }, l.max))))))), /*#__PURE__*/React.createElement("div", {
    className: "tpl-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tpl-sec-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sec-title"
  }, "CSV column reference"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-up",
    size: 18,
    style: {
      color: "var(--text-secondary)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Column name"), /*#__PURE__*/React.createElement("th", null, "Description"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right"
    }
  }, "Required"))), /*#__PURE__*/React.createElement("tbody", null, COLUMNS.map(c => /*#__PURE__*/React.createElement("tr", {
    key: c.name
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, c.name), /*#__PURE__*/React.createElement("td", {
    style: {
      color: "var(--text-secondary)"
    }
  }, c.desc), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: "right"
    }
  }, c.req ? /*#__PURE__*/React.createElement("span", {
    className: "req-yes"
  }, "Yes") : /*#__PURE__*/React.createElement("span", {
    className: "req-no"
  }, "No"))))))))));
}
Object.assign(window, {
  DownloadTemplate
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/downloadTemplate.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/instructorDashboard.jsx
try { (() => {
// Validata UI kit — Instructor Dashboard.

const MODULES = [{
  name: "Advanced Hematology",
  cohort: "Cohort A",
  spec: "Clinical Pathology",
  submitted: 14
}, {
  name: "Molecular Diagnostics",
  cohort: "Cohort B",
  spec: "Genetics",
  submitted: 8
}];
const MY_UPLOADS = [{
  file: "hematology_results_oct.csv",
  date: "Oct 24, 2023",
  acc: 12,
  rej: 2,
  status: ["warning", "Partial Success"],
  report: true
}, {
  file: "genetics_cohort_b.csv",
  date: "Oct 22, 2023",
  acc: 8,
  rej: 0,
  status: ["success", "Success"],
  report: false
}, {
  file: "hematology_results_sep.csv",
  date: "Sep 30, 2023",
  acc: 15,
  rej: 0,
  status: ["success", "Success"],
  report: false
}, {
  file: "initial_assessment_q3.csv",
  date: "Sep 15, 2023",
  acc: 0,
  rej: 24,
  status: ["danger", "Failed"],
  report: true
}];
function UploadsTable({
  onOpenReport,
  rows,
  lightHead
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap" + (lightHead ? " tbl-light-wrap" : "")
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl" + (lightHead ? " tbl-light" : "")
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "File"), /*#__PURE__*/React.createElement("th", null, "Date"), /*#__PURE__*/React.createElement("th", null, "Accepted"), /*#__PURE__*/React.createElement("th", null, "Rejected"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", null, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file-text",
    size: 16,
    style: {
      color: "var(--text-secondary)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, r.file))), /*#__PURE__*/React.createElement("td", {
    style: {
      color: "var(--text-secondary)"
    }
  }, r.date), /*#__PURE__*/React.createElement("td", null, r.acc), /*#__PURE__*/React.createElement("td", {
    style: {
      color: r.rej > 0 ? "var(--danger)" : "inherit",
      fontWeight: r.rej > 0 ? 600 : 400
    }
  }, r.rej), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Pill, {
    tone: r.status[0]
  }, r.status[1])), /*#__PURE__*/React.createElement("td", null, r.report ? /*#__PURE__*/React.createElement("button", {
    className: "link",
    onClick: onOpenReport
  }, "View report \u2192") : /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, "\u2014")))))));
}
function InstructorDashboard({
  onUpload,
  onOpenReport
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "Dashboard"), /*#__PURE__*/React.createElement("p", {
    className: "page-sub"
  }, "Welcome back, Sarah"))), /*#__PURE__*/React.createElement("h2", {
    className: "sec-title",
    style: {
      marginBottom: 16
    }
  }, "Assigned modules"), /*#__PURE__*/React.createElement("div", {
    className: "mod-grid"
  }, MODULES.map(m => /*#__PURE__*/React.createElement("div", {
    className: "card card-pad mod-card",
    key: m.name
  }, /*#__PURE__*/React.createElement("div", {
    className: "mod-top"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "mod-name"
  }, m.name), /*#__PURE__*/React.createElement("div", {
    className: "mod-meta"
  }, m.cohort, " \xB7 ", m.spec)), /*#__PURE__*/React.createElement("span", {
    className: "lab-badge"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "flask-conical",
    size: 14
  }), " Lab")), /*#__PURE__*/React.createElement("div", {
    className: "mod-sub"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clipboard-check",
    size: 17,
    style: {
      color: "var(--text-secondary)"
    }
  }), " ", m.submitted, " results submitted"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "upload",
    style: {
      width: "100%"
    },
    onClick: onUpload
  }, "Upload results")))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head sec-head-navy"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "sec-title",
    style: {
      color: "#fff"
    }
  }, "My recent uploads")), /*#__PURE__*/React.createElement(UploadsTable, {
    rows: MY_UPLOADS,
    onOpenReport: onOpenReport,
    lightHead: true
  })));
}
Object.assign(window, {
  InstructorDashboard,
  UploadsTable,
  MY_UPLOADS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/instructorDashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/learnerRoster.jsx
try { (() => {
// Validata UI kit — Learner Roster (admin): filtered table + add-learner drawer.

const LEARNERS = [{
  name: "Eleanor Vance",
  email: "e.vance@example.com",
  cohort: "Fall 2023",
  spec: "Data Science",
  status: ["success", "Active"]
}, {
  name: "Marcus Sterling",
  email: "m.sterling@example.com",
  cohort: "Spring 2024",
  spec: "UX Design",
  status: ["success", "Active"]
}, {
  name: "Sophia Chen",
  email: "schen.dev@example.com",
  cohort: "Fall 2023",
  spec: "Software Eng",
  status: ["danger", "Archived"]
}, {
  name: "Julian Bashir",
  email: "jbashir@med.example.com",
  cohort: "Spring 2024",
  spec: "Data Science",
  status: ["success", "Active"]
}, {
  name: "Kira Nerys",
  email: "knerys@example.com",
  cohort: "Fall 2023",
  spec: "UX Design",
  status: ["success", "Active"]
}, {
  name: "Odo",
  email: "odo.sec@example.com",
  cohort: "Spring 2024",
  spec: "Software Eng",
  status: ["danger", "Archived"]
}];
function LearnerRoster() {
  const [open, setOpen] = React.useState(false);
  const [tab, setTab] = React.useState("Active");
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "Learner roster"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "user-plus",
    onClick: () => setOpen(true)
  }, "Add learner"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "upload"
  }, "Import CSV"))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "toolbar"
  }, /*#__PURE__*/React.createElement(SearchInput, {
    placeholder: "Search learners\u2026"
  }), /*#__PURE__*/React.createElement(SelectField, {
    value: "All Cohorts",
    width: 170
  }), /*#__PURE__*/React.createElement(SelectField, {
    value: "All Specializations",
    width: 200
  }), /*#__PURE__*/React.createElement(SegToggle, {
    options: ["Active", "Archived"],
    value: tab,
    onChange: setTab
  })), /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    style: {
      width: 44
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox"
  })), /*#__PURE__*/React.createElement("th", null, "Full name"), /*#__PURE__*/React.createElement("th", null, "Email"), /*#__PURE__*/React.createElement("th", null, "Cohort"), /*#__PURE__*/React.createElement("th", null, "Specialization"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right"
    }
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, LEARNERS.map(l => /*#__PURE__*/React.createElement("tr", {
    key: l.email
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox"
  })), /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: 600
    }
  }, l.name), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      color: "var(--text-secondary)"
    }
  }, l.email), /*#__PURE__*/React.createElement("td", null, l.cohort), /*#__PURE__*/React.createElement("td", null, l.spec), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Pill, {
    tone: l.status[0]
  }, l.status[1])), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement(Kebab, null)))))), /*#__PURE__*/React.createElement(Pagination, {
    from: 1,
    to: 6,
    total: 142,
    pages: 9,
    current: 1
  })), /*#__PURE__*/React.createElement(Drawer, {
    open: open,
    title: "Add learner",
    subtitle: "Learners are reference records used for validation lookups.",
    onClose: () => setOpen(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setOpen(false)
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      onClick: () => setOpen(false)
    }, "Add learner"))
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "Full name",
    placeholder: "e.g. Eleanor Vance"
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "Email",
    placeholder: "name@example.com",
    hint: "Canonical identifier \u2014 must be unique, matched case-insensitively in CSVs.",
    mono: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "ff-row"
  }, /*#__PURE__*/React.createElement(SelectFieldForm, {
    label: "Cohort",
    value: "Fall 2023"
  }), /*#__PURE__*/React.createElement(SelectFieldForm, {
    label: "Specialization",
    value: "Data Science"
  })), /*#__PURE__*/React.createElement(SelectFieldForm, {
    label: "Status",
    value: "Active"
  })));
}
Object.assign(window, {
  LearnerRoster
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/learnerRoster.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/login.jsx
try { (() => {
// Validata UI kit — Login screen.

function Login({
  onSignIn,
  onFirstLogin
}) {
  const [email, setEmail] = React.useState("admin@organization.com");
  const [pw, setPw] = React.useState("lab-admin-2024");
  const [show, setShow] = React.useState(false);
  const [role, setRole] = React.useState("admin");
  const features = [{
    icon: "shield-check",
    title: "Strict validation",
    sub: "Multi-tier verification engine"
  }, {
    icon: "scroll-text",
    title: "Audit trail",
    sub: "Immutable logs for every action"
  }, {
    icon: "line-chart",
    title: "Power BI ready",
    sub: "Direct export for analytics tools"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "login"
  }, /*#__PURE__*/React.createElement("div", {
    className: "login-brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "login-glow"
  }), /*#__PURE__*/React.createElement("div", {
    className: "login-top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb-mark"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "microscope",
    size: 24,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("span", {
    className: "lb-word"
  }, "Validata")), /*#__PURE__*/React.createElement("p", {
    className: "lb-tag"
  }, "The single source of truth for lab results validation and internal data auditing.")), /*#__PURE__*/React.createElement("div", {
    className: "lb-features"
  }, features.map(f => /*#__PURE__*/React.createElement("div", {
    className: "lb-feature",
    key: f.title
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb-fic"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: f.icon,
    size: 20,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "lb-ftitle"
  }, f.title), /*#__PURE__*/React.createElement("div", {
    className: "lb-fsub"
  }, f.sub))))), /*#__PURE__*/React.createElement("div", {
    className: "lb-foot"
  }, "\xA9 2024 Lab Results Validator. Internal Tooling. Version 2.4.0-pro")), /*#__PURE__*/React.createElement("div", {
    className: "login-form-pane"
  }, /*#__PURE__*/React.createElement("form", {
    className: "login-card",
    onSubmit: e => {
      e.preventDefault();
      onSignIn(role);
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lc-head"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "lc-title"
  }, "Sign in"), /*#__PURE__*/React.createElement("p", {
    className: "lc-sub"
  }, "Access the internal lab results dashboard")), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Sign in as"), /*#__PURE__*/React.createElement("div", {
    className: "seg"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "seg-btn" + (role === "admin" ? " on" : ""),
    onClick: () => {
      setRole("admin");
      setEmail("admin@organization.com");
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield",
    size: 15
  }), " Administrator"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "seg-btn" + (role === "instructor" ? " on" : ""),
    onClick: () => {
      setRole("instructor");
      setEmail("s.jenkins@organization.com");
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "microscope",
    size: 15
  }), " Instructor"))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Email address"), /*#__PURE__*/React.createElement("div", {
    className: "input"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lead"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mail",
    size: 17
  })), /*#__PURE__*/React.createElement("input", {
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "name@organization.com"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("label", null, "Password"), /*#__PURE__*/React.createElement("a", {
    className: "link",
    href: "#",
    onClick: e => e.preventDefault()
  }, "Forgot password?")), /*#__PURE__*/React.createElement("div", {
    className: "input"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lead"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 17
  })), /*#__PURE__*/React.createElement("input", {
    type: show ? "text" : "password",
    value: pw,
    onChange: e => setPw(e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "trail",
    onClick: () => setShow(!show),
    "aria-label": "Toggle password"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: show ? "eye-off" : "eye",
    size: 18
  })))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    type: "submit",
    iconRight: "arrow-right",
    style: {
      width: "100%"
    }
  }, "Sign in"), /*#__PURE__*/React.createElement("div", {
    className: "lc-foot"
  }, "First time here? ", /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "link",
    onClick: onFirstLogin
  }, "Set your password"), " \xB7 Contact your administrator if you don't have an account.")), /*#__PURE__*/React.createElement("div", {
    className: "lc-secure"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield",
    size: 12
  }), " SECURE 256-BIT ENCRYPTED SESSION")));
}
Object.assign(window, {
  Login
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/login.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/myUploads.jsx
try { (() => {
// Validata UI kit — My Uploads (instructor full history).

function MyUploads({
  onOpenReport
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "My uploads"), /*#__PURE__*/React.createElement("p", {
    className: "page-sub"
  }, "Every CSV you've submitted, with its validation outcome."))), /*#__PURE__*/React.createElement(UploadsTable, {
    rows: MY_UPLOADS,
    onOpenReport: onOpenReport
  }));
}
Object.assign(window, {
  MyUploads
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/myUploads.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/powerBi.jsx
try { (() => {
// Validata UI kit — Power BI Connection (admin).

function PowerBI() {
  const steps = ["Open Power BI Desktop.", "Select Get Data → Web API.", "Paste the Endpoint URL.", "Use Basic Auth with the Workspace ID as username and Client Secret as password."];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "crumbs",
    style: {
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, "Settings"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 14
  }), /*#__PURE__*/React.createElement("span", {
    className: "cur"
  }, "Power BI Connection")), /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "Power BI integration"))), /*#__PURE__*/React.createElement("div", {
    className: "pbi-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pbi-left"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card card-pad"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "sec-title",
    style: {
      marginBottom: 16
    }
  }, "Connection status"), /*#__PURE__*/React.createElement(Pill, {
    tone: "success"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      background: "var(--success)"
    }
  }), "Connected"), /*#__PURE__*/React.createElement("p", {
    className: "page-sub",
    style: {
      margin: "14px 0 16px"
    }
  }, "Last synced: Today, 10:42 AM EST"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "refresh-cw",
    style: {
      width: "100%"
    }
  }, "Refresh connection")), /*#__PURE__*/React.createElement("div", {
    className: "card card-pad"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "sec-title",
    style: {
      marginBottom: 14
    }
  }, "Configuration guide"), /*#__PURE__*/React.createElement("ol", {
    className: "pbi-steps"
  }, steps.map((s, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "pbi-step-n"
  }, i + 1), /*#__PURE__*/React.createElement("span", null, s)))), /*#__PURE__*/React.createElement("button", {
    className: "link",
    style: {
      marginTop: 16,
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "download",
    size: 16
  }), " Download configuration guide (PDF)"))), /*#__PURE__*/React.createElement("div", {
    className: "card card-pad pbi-creds"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pbi-creds-head"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "sec-title"
  }, "API credentials"), /*#__PURE__*/React.createElement(Icon, {
    name: "key-round",
    size: 20,
    style: {
      color: "var(--text-secondary)"
    }
  })), /*#__PURE__*/React.createElement(CopyField, {
    label: "API Endpoint URL",
    value: "https://api.labvalidator.internal/v1/powerbi/sync"
  }), /*#__PURE__*/React.createElement(CopyField, {
    label: "Workspace ID",
    value: "wrk_8f92bd3a4c"
  }), /*#__PURE__*/React.createElement(CopyField, {
    label: "Client Secret",
    value: "sk_test_4f98d2b1e6a7c390f1",
    secret: true
  }), /*#__PURE__*/React.createElement("p", {
    className: "ff-hint"
  }, "Treat this secret like a password. Do not share it publicly."), /*#__PURE__*/React.createElement("div", {
    className: "pbi-regen"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "refresh-cw"
  }, "Regenerate credentials")))));
}
Object.assign(window, {
  PowerBI
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/powerBi.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/primitives.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Validata UI kit — shared primitives. Exposed on window for cross-file use.

// Lucide icon wrapper. React owns the <span>; lucide replaces the inner <i>.
function Icon({
  name,
  size = 18,
  color = "currentColor",
  style = {}
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "ic",
    style: {
      width: size,
      height: size,
      color,
      ...style
    },
    dangerouslySetInnerHTML: {
      __html: `<i data-lucide="${name}"></i>`
    }
  });
}
function Button({
  variant = "primary",
  size,
  icon,
  iconRight,
  children,
  ...props
}) {
  const cls = ["btn", `btn-${variant}`, size === "sm" ? "btn-sm" : ""].join(" ").trim();
  const isz = size === "sm" ? 16 : 17;
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls
  }, props), icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: isz
  }), children, iconRight && /*#__PURE__*/React.createElement(Icon, {
    name: iconRight,
    size: isz
  }));
}
function Pill({
  tone = "info",
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: `pill pill-${tone}`
  }, children);
}
function StatCard({
  label,
  value,
  chipIcon,
  chipBg,
  chipFg,
  footDot,
  footText
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-top"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "stat-cap"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "stat-num"
  }, value)), /*#__PURE__*/React.createElement("div", {
    className: "stat-chip",
    style: {
      background: chipBg,
      color: chipFg
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: chipIcon,
    size: 16
  }))), /*#__PURE__*/React.createElement("div", {
    className: "stat-foot"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      background: footDot
    }
  }), footText));
}
Object.assign(window, {
  Icon,
  Button,
  Pill,
  StatCard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/primitives.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/referenceData.jsx
try { (() => {
// Validata UI kit — Reference Data (admin): three-column miller + add-lab drawer.

const SPECS = ["Data Analytics", "Software Engineering", "Cloud & DevOps"];
const MODULES = [{
  code: "DA-01",
  name: "Python Fundamentals"
}, {
  code: "DA-02",
  name: "Data Wrangling"
}, {
  code: "DA-03",
  name: "SQL & Databases"
}, {
  code: "DA-04",
  name: "Visualisation"
}];
const LABS = [{
  title: "Lab 1 — Intro to Python",
  max: 100,
  locked: true
}, {
  title: "Lab 2 — Functions & Loops",
  max: 80,
  locked: true
}, {
  title: "Lab 3 — OOP Basics",
  max: 80,
  locked: true
}];
function ColHead({
  title,
  action,
  onAction
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "rd-colhead"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "rd-coltitle"
  }, title), action && /*#__PURE__*/React.createElement("button", {
    className: "link",
    onClick: onAction
  }, action));
}
function ReferenceData() {
  const [spec, setSpec] = React.useState(0);
  const [mod, setMod] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [forceEdit, setForceEdit] = React.useState(null); // lab being force-edited
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "crumbs",
    style: {
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, "Home"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 14
  }), /*#__PURE__*/React.createElement("span", {
    className: "cur"
  }, "Cohort 7 \u2014 Spring 2026")), /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "Reference data")), /*#__PURE__*/React.createElement(SelectField, {
    value: "Cohort 7 \u2014 Spring 2026",
    width: 260
  })), /*#__PURE__*/React.createElement("div", {
    className: "rd-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card rd-col"
  }, /*#__PURE__*/React.createElement(ColHead, {
    title: "Specializations",
    action: "+ Add"
  }), /*#__PURE__*/React.createElement("div", {
    className: "rd-list"
  }, SPECS.map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: s,
    className: "rd-item" + (i === spec ? " on" : ""),
    onClick: () => {
      setSpec(i);
      setMod(0);
    }
  }, /*#__PURE__*/React.createElement("span", null, s), i === spec && /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "card rd-col"
  }, /*#__PURE__*/React.createElement(ColHead, {
    title: "Modules",
    action: "+ Add"
  }), /*#__PURE__*/React.createElement("div", {
    className: "rd-list"
  }, MODULES.map((m, i) => /*#__PURE__*/React.createElement("button", {
    key: m.code,
    className: "rd-item rd-item-mono" + (i === mod ? " on" : ""),
    onClick: () => setMod(i)
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, m.code), " \xB7 ", m.name), i === mod && /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 16
  }))))), /*#__PURE__*/React.createElement("div", {
    className: "card rd-col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rd-colhead"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "rd-coltitle"
  }, "Labs"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "sm",
    icon: "plus",
    onClick: () => setOpen(true)
  }, "Add lab")), /*#__PURE__*/React.createElement("table", {
    className: "tbl tbl-light",
    style: {
      borderTop: "1px solid var(--border)"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Lab title"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right"
    }
  }, "Max score"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right"
    }
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, LABS.map(l => /*#__PURE__*/React.createElement("tr", {
    key: l.title
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: 500
    }
  }, l.title), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      textAlign: "right"
    }
  }, l.max), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: "right",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "rd-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "rd-iconbtn",
    disabled: l.locked,
    title: l.locked ? "Has results — locked" : "Edit"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pencil",
    size: 16
  })), l.locked && /*#__PURE__*/React.createElement("button", {
    className: "rd-iconbtn",
    onClick: () => setForceEdit(l),
    title: "Force edit"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 16
  })))))))), /*#__PURE__*/React.createElement("div", {
    className: "rd-note"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 16,
    style: {
      color: "var(--orange-deep)",
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", null, "Labs with results attached cannot be edited. Use force-edit to update with audit trail. ", /*#__PURE__*/React.createElement("button", {
    className: "link"
  }, "Learn more"))))), /*#__PURE__*/React.createElement(Drawer, {
    open: open,
    title: "Add lab",
    subtitle: "Define a lab title and its maximum score.",
    onClose: () => setOpen(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setOpen(false)
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      onClick: () => setOpen(false)
    }, "Add lab"))
  }, /*#__PURE__*/React.createElement(TextField, {
    label: "Lab title",
    placeholder: "e.g. Lab 4 \u2014 Pandas",
    hint: "Validation compares the CSV lab_title against this value exactly."
  }), /*#__PURE__*/React.createElement(TextField, {
    label: "Max score",
    placeholder: "100",
    mono: true,
    hint: "Score in uploaded rows must be 0 \u2264 score \u2264 max score."
  })), /*#__PURE__*/React.createElement(Modal, {
    open: !!forceEdit,
    tone: "warning",
    title: "Force-edit lab",
    subtitle: forceEdit ? forceEdit.title : "",
    onClose: () => setForceEdit(null),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setForceEdit(null)
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      variant: "danger",
      onClick: () => setForceEdit(null)
    }, "Confirm force-edit"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "callout",
    style: {
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert-triangle",
    size: 20,
    color: "#A83900"
  }), /*#__PURE__*/React.createElement("p", {
    className: "callout-body"
  }, "This lab has results attached. Changes apply forward-only and are recorded in the audit trail. Existing committed rows are not modified.")), /*#__PURE__*/React.createElement(TextField, {
    label: "New max score",
    value: forceEdit ? String(forceEdit.max) : "",
    mono: true
  }), /*#__PURE__*/React.createElement("label", {
    className: "ff"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ff-label"
  }, "Reason for change ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--danger)"
    }
  }, "*")), /*#__PURE__*/React.createElement("span", {
    className: "ff-input",
    style: {
      height: "auto",
      alignItems: "stretch",
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("textarea", {
    className: "ff-textarea",
    placeholder: "Required \u2014 recorded in the audit log (e.g. corrected from 80 to 100 per syllabus update).",
    rows: 3
  })))));
}
Object.assign(window, {
  ReferenceData
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/referenceData.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/report.jsx
try { (() => {
// Validata UI kit — Validation Report screen.

const REJECTED = [{
  row: 12,
  email: "j.doe@example.com",
  field: "completion_date",
  rule: "VAL-DATE-01",
  msg: "Invalid date format. Expected YYYY-MM-DD."
}, {
  row: 18,
  email: "smith.a@domain.org",
  field: "score_module_1",
  rule: "VAL-NUM-03",
  msg: "Value exceeds maximum allowed score of 100."
}, {
  row: 24,
  email: "williams_r@university.edu",
  field: "instructor_id",
  rule: "VAL-REQ-01",
  msg: "Required field is missing or empty."
}, {
  row: 41,
  email: "invalid.email@",
  field: "learner_email",
  rule: "VAL-FMT-02",
  msg: "Malformed email address string."
}];
function SummaryCard({
  tone,
  icon,
  label,
  value,
  total
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "sum-card sum-" + tone
  }, /*#__PURE__*/React.createElement("div", {
    className: "sum-cap"
  }, icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 15
  }), label), /*#__PURE__*/React.createElement("div", {
    className: "sum-val"
  }, value, total && /*#__PURE__*/React.createElement("span", {
    className: "sum-total"
  }, " / ", total)));
}
function Report() {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "report-head card card-pad"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "Validation report"), /*#__PURE__*/React.createElement("div", {
    className: "report-meta"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "file-text",
    size: 15
  }), " ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "lab_results_batch_Q3_final.csv")), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 15
  }), " Oct 24, 2023 at 14:32 PST"))), /*#__PURE__*/React.createElement("div", {
    className: "report-actions"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    icon: "download"
  }, "Download corrections CSV"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "upload"
  }, "Re-upload fixed file"))), /*#__PURE__*/React.createElement("div", {
    className: "sum-row"
  }, /*#__PURE__*/React.createElement(SummaryCard, {
    tone: "neutral",
    label: "TOTAL ROWS EVALUATED",
    value: "48"
  }), /*#__PURE__*/React.createElement(SummaryCard, {
    tone: "success",
    icon: "check-circle",
    label: "ACCEPTED",
    value: "43",
    total: "48"
  }), /*#__PURE__*/React.createElement(SummaryCard, {
    tone: "danger",
    icon: "alert-circle",
    label: "REJECTED",
    value: "5",
    total: "48"
  })), /*#__PURE__*/React.createElement("div", {
    className: "rej-head"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "sec-title"
  }, "Rejected rows detail"), /*#__PURE__*/React.createElement("span", {
    className: "rej-count"
  }, "Viewing 4 of 5 errors")), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Row #"), /*#__PURE__*/React.createElement("th", null, "Learner email"), /*#__PURE__*/React.createElement("th", null, "Failing field"), /*#__PURE__*/React.createElement("th", null, "Rule ID"), /*#__PURE__*/React.createElement("th", null, "Error message"))), /*#__PURE__*/React.createElement("tbody", null, REJECTED.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.row
  }, /*#__PURE__*/React.createElement("td", {
    className: "mono"
  }, r.row), /*#__PURE__*/React.createElement("td", null, r.email), /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: 500
    }
  }, r.field), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "rule-id"
  }, r.rule)), /*#__PURE__*/React.createElement("td", {
    style: {
      color: "var(--danger)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      gap: 6,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "alert-triangle",
    size: 15
  }), " ", r.msg))))))), /*#__PURE__*/React.createElement("div", {
    className: "callout",
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 22,
    color: "#A83900"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "callout-title"
  }, "Partial commit status"), /*#__PURE__*/React.createElement("p", {
    className: "callout-body"
  }, "The 43 valid rows have been successfully committed to the primary database. The 5 rejected rows listed above were skipped. You may correct these specific errors in the provided CSV and upload it as a supplemental batch without duplicating the successful records."))));
}
Object.assign(window, {
  Report
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/report.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/setPassword.jsx
try { (() => {
// Validata UI kit — Set New Password (forced first-login).
// Note: the Figma left panel uses a stock data-center photo; here we mirror the
// login screen's navy gradient treatment to stay in-system (no external image).

function SetPassword({
  onContinue,
  onBack
}) {
  const [pw, setPw] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [show2, setShow2] = React.useState(false);
  const score = pw.length === 0 ? 0 : pw.length < 6 ? 1 : pw.length < 10 ? 2 : /[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw) ? 4 : 3;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  return /*#__PURE__*/React.createElement("div", {
    className: "login"
  }, /*#__PURE__*/React.createElement("div", {
    className: "login-brand setpw-brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "login-glow"
  }), /*#__PURE__*/React.createElement("div", {
    className: "login-top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lb-mark"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "microscope",
    size: 24,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("span", {
    className: "lb-word"
  }, "Validata"))), /*#__PURE__*/React.createElement("div", {
    className: "setpw-hero"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "setpw-hero-title"
  }, "Secure your access to critical data infrastructure."), /*#__PURE__*/React.createElement("p", {
    className: "setpw-hero-sub"
  }, "You are setting up your administrator credentials for the first time. Please choose a strong password to ensure the integrity of our internal validation systems."))), /*#__PURE__*/React.createElement("div", {
    className: "login-form-pane"
  }, /*#__PURE__*/React.createElement("form", {
    className: "login-card setpw-card",
    onSubmit: e => {
      e.preventDefault();
      onContinue && onContinue();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lc-head"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "lc-title"
  }, "Set your password"), /*#__PURE__*/React.createElement("p", {
    className: "lc-sub"
  }, "This is your first login. Choose a secure password to continue.")), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "New password"), /*#__PURE__*/React.createElement("div", {
    className: "input"
  }, /*#__PURE__*/React.createElement("input", {
    type: show ? "text" : "password",
    value: pw,
    onChange: e => setPw(e.target.value),
    placeholder: "Enter your new password"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "trail",
    onClick: () => setShow(!show),
    "aria-label": "Toggle"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: show ? "eye-off" : "eye",
    size: 18
  })))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(StrengthMeter, {
    score: score || 1,
    label: labels[score] || "Weak"
  }), /*#__PURE__*/React.createElement("p", {
    className: "ff-hint",
    style: {
      marginTop: 8
    }
  }, "Must be at least 8 characters with numbers and symbols.")), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Confirm password"), /*#__PURE__*/React.createElement("div", {
    className: "input"
  }, /*#__PURE__*/React.createElement("input", {
    type: show2 ? "text" : "password",
    placeholder: "Re-enter your password"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "trail",
    onClick: () => setShow2(!show2),
    "aria-label": "Toggle"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: show2 ? "eye-off" : "eye",
    size: 18
  })))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    type: "submit",
    style: {
      width: "100%"
    }
  }, "Set password & continue"), onBack && /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "link",
    style: {
      textAlign: "center"
    },
    onClick: onBack
  }, "Back to sign in"))));
}
Object.assign(window, {
  SetPassword
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/setPassword.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/settings.jsx
try { (() => {
// Validata UI kit — Settings (designed from scratch, in-system).
// Surfaces PRD open-questions (§12) and notification policy (§9.7) as admin controls.

function ToggleControl({
  on
}) {
  const [v, setV] = React.useState(!!on);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "toggle" + (v ? " on" : ""),
    onClick: () => setV(!v),
    "aria-pressed": v
  }, /*#__PURE__*/React.createElement("span", {
    className: "toggle-knob"
  }));
}
function SettingRow({
  title,
  desc,
  control,
  last
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "set-row" + (last ? " last" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "set-row-text"
  }, /*#__PURE__*/React.createElement("div", {
    className: "set-row-title"
  }, title), desc && /*#__PURE__*/React.createElement("div", {
    className: "set-row-desc"
  }, desc)), /*#__PURE__*/React.createElement("div", {
    className: "set-row-ctrl"
  }, control));
}
function SettingsScreen({
  onOpenPowerBI
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "Settings"), /*#__PURE__*/React.createElement("p", {
    className: "page-sub"
  }, "Configure validation behaviour, notifications, and integrations."))), /*#__PURE__*/React.createElement("div", {
    className: "set-stack"
  }, /*#__PURE__*/React.createElement("section", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "sec-title"
  }, "Validation preferences")), /*#__PURE__*/React.createElement("div", {
    className: "set-body"
  }, /*#__PURE__*/React.createElement(SettingRow, {
    title: "Strict column order",
    desc: "Require uploaded CSVs to match the template column order exactly.",
    control: /*#__PURE__*/React.createElement(ToggleControl, {
      on: true
    })
  }), /*#__PURE__*/React.createElement(SettingRow, {
    title: "Case-insensitive matching",
    desc: "Match lab titles and module names ignoring case \u2014 flags a warning when case differs from the configured form.",
    control: /*#__PURE__*/React.createElement(ToggleControl, {
      on: true
    })
  }), /*#__PURE__*/React.createElement(SettingRow, {
    title: "Max attempts per lab",
    desc: "Maximum submissions allowed per learner, per lab.",
    control: /*#__PURE__*/React.createElement(SelectField, {
      value: "2",
      width: 90
    }),
    last: true
  }))), /*#__PURE__*/React.createElement("section", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "sec-title"
  }, "Notifications")), /*#__PURE__*/React.createElement("div", {
    className: "set-body"
  }, /*#__PURE__*/React.createElement(SettingRow, {
    title: "Upload-complete summary",
    desc: "Email the uploading instructor an accepted / rejected summary when validation finishes.",
    control: /*#__PURE__*/React.createElement(ToggleControl, {
      on: true
    })
  }), /*#__PURE__*/React.createElement(SettingRow, {
    title: "High-failure admin digest",
    desc: "Email admins when an upload's rejection rate exceeds the threshold below.",
    control: /*#__PURE__*/React.createElement(ToggleControl, {
      on: true
    })
  }), /*#__PURE__*/React.createElement(SettingRow, {
    title: "High-failure threshold",
    desc: "Rejection rate that triggers the admin digest.",
    control: /*#__PURE__*/React.createElement(SelectField, {
      value: "50%",
      width: 100
    }),
    last: true
  }))), /*#__PURE__*/React.createElement("section", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "sec-title"
  }, "Integrations")), /*#__PURE__*/React.createElement("div", {
    className: "set-body"
  }, /*#__PURE__*/React.createElement(SettingRow, {
    title: "Power BI",
    desc: "Read-only reporting views for dashboards. Connected \xB7 last synced today.",
    control: /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      iconRight: "arrow-right",
      onClick: onOpenPowerBI
    }, "Manage"),
    last: true
  }))), /*#__PURE__*/React.createElement("section", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sec-head"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "sec-title"
  }, "Data retention")), /*#__PURE__*/React.createElement("div", {
    className: "set-body"
  }, /*#__PURE__*/React.createElement(SettingRow, {
    title: "Keep upload error reports",
    desc: "How long to retain structured validation reports for audit.",
    control: /*#__PURE__*/React.createElement(SelectField, {
      value: "Indefinitely",
      width: 170
    }),
    last: true
  })))));
}
Object.assign(window, {
  SettingsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/settings.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/shell.jsx
try { (() => {
// Validata UI kit — app shell: role-aware sidebar + topbar.

const ADMIN_NAV = [{
  id: "a-dashboard",
  label: "Dashboard",
  icon: "layout-dashboard",
  crumb: "Dashboard"
}, {
  id: "a-cohorts",
  label: "Cohorts",
  icon: "layers",
  crumb: "Cohorts"
}, {
  id: "a-refdata",
  label: "Reference Data",
  icon: "folder-tree",
  crumb: "Reference data"
}, {
  id: "a-learners",
  label: "Learners",
  icon: "graduation-cap",
  crumb: "Learner roster"
}, {
  id: "a-users",
  label: "User Management",
  icon: "users",
  crumb: "User management"
}, {
  id: "a-reports",
  label: "Reports",
  icon: "bar-chart-2",
  crumb: "Audit log"
}, {
  id: "a-powerbi",
  label: "Power BI",
  icon: "plug-zap",
  crumb: "Power BI connection"
}];
const ADMIN_FOOTER = [{
  id: "a-settings",
  label: "Settings",
  icon: "settings",
  crumb: "Settings"
}];
const INSTRUCTOR_NAV = [{
  id: "i-dashboard",
  label: "Dashboard",
  icon: "layout-dashboard",
  crumb: "Dashboard"
}, {
  id: "i-template",
  label: "Download Template",
  icon: "file-down",
  crumb: "Download template"
}, {
  id: "i-upload",
  label: "Upload Results",
  icon: "upload-cloud",
  crumb: "Upload results"
}, {
  id: "i-myuploads",
  label: "My Uploads",
  icon: "files",
  crumb: "My uploads"
}];
const NAV_FOR = role => role === "instructor" ? INSTRUCTOR_NAV : ADMIN_NAV;
const FOOTER_FOR = role => role === "instructor" ? [] : ADMIN_FOOTER;
const ALL_NAV_FOR = role => [...NAV_FOR(role), ...FOOTER_FOR(role)];
const USERS = {
  admin: {
    name: "David Kim",
    role: "Admin",
    initials: "DK"
  },
  instructor: {
    name: "Sarah Jenkins",
    role: "Instructor",
    initials: "SJ"
  }
};
function Sidebar({
  role,
  active,
  onNavigate,
  onLogout
}) {
  return /*#__PURE__*/React.createElement("aside", {
    className: "sidebar"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mark"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "microscope",
    size: 18,
    color: "#fff"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "name"
  }, "Validata"), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Internal Tool"))), /*#__PURE__*/React.createElement("nav", {
    className: "nav"
  }, NAV_FOR(role).map(n => /*#__PURE__*/React.createElement("button", {
    key: n.id,
    className: "nav-item" + (active === n.id ? " active" : ""),
    onClick: () => onNavigate(n.id)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: n.icon,
    size: 18
  }), n.label)))), /*#__PURE__*/React.createElement("div", {
    className: "nav-foot"
  }, FOOTER_FOR(role).map(n => /*#__PURE__*/React.createElement("button", {
    key: n.id,
    className: "nav-item" + (active === n.id ? " active" : ""),
    onClick: () => onNavigate(n.id)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: n.icon,
    size: 18
  }), n.label)), /*#__PURE__*/React.createElement("button", {
    className: "nav-item",
    onClick: onLogout
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "log-out",
    size: 18
  }), "Logout")));
}
function Topbar({
  crumb,
  user
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "crumbs"
  }, /*#__PURE__*/React.createElement("span", null, "Home"), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 15
  }), /*#__PURE__*/React.createElement("span", {
    className: "cur"
  }, crumb)), /*#__PURE__*/React.createElement("div", {
    className: "topbar-right"
  }, user.role === "Instructor" && /*#__PURE__*/React.createElement("span", {
    className: "topbar-name"
  }, user.name), /*#__PURE__*/React.createElement("span", {
    className: "role-badge"
  }, user.role), /*#__PURE__*/React.createElement("div", {
    className: "avatar"
  }, user.initials)));
}
function AppShell({
  role,
  active,
  crumb,
  onNavigate,
  onLogout,
  children
}) {
  const user = USERS[role] || USERS.admin;
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement(Sidebar, {
    role: role,
    active: active,
    onNavigate: onNavigate,
    onLogout: onLogout
  }), /*#__PURE__*/React.createElement("div", {
    className: "main"
  }, /*#__PURE__*/React.createElement(Topbar, {
    crumb: crumb,
    user: user
  }), /*#__PURE__*/React.createElement("div", {
    className: "content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container",
    key: active
  }, children))));
}
Object.assign(window, {
  Sidebar,
  Topbar,
  AppShell,
  ADMIN_NAV,
  ADMIN_FOOTER,
  INSTRUCTOR_NAV,
  NAV_FOR,
  FOOTER_FOR,
  ALL_NAV_FOR,
  USERS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/upload.jsx
try { (() => {
// Validata UI kit — Upload Results screen (with processing + complete states).

function Upload({
  onValidate
}) {
  const [over, setOver] = React.useState(false);
  const [file, setFile] = React.useState(null);
  const [phase, setPhase] = React.useState("idle"); // idle | processing

  const run = () => {
    setPhase("processing");
    setTimeout(() => {
      setPhase("idle");
      onValidate && onValidate();
    }, 1800);
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "Upload results")), /*#__PURE__*/React.createElement("div", {
    className: "card card-pad upload-card"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "upload-title"
  }, "Upload lab results CSV"), phase === "processing" ? /*#__PURE__*/React.createElement("div", {
    className: "dropzone",
    style: {
      cursor: "default"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dz-icon"
  }, /*#__PURE__*/React.createElement("span", {
    className: "spinner"
  })), /*#__PURE__*/React.createElement("p", {
    className: "dz-title"
  }, "Validating ", file), /*#__PURE__*/React.createElement("p", {
    className: "dz-sub"
  }, "Running structural, field, and referential checks on 48 rows\u2026"), /*#__PURE__*/React.createElement("div", {
    className: "upload-progress"
  }, /*#__PURE__*/React.createElement("span", {
    className: "upload-progress-bar"
  }))) : /*#__PURE__*/React.createElement("div", {
    className: "dropzone" + (over ? " over" : ""),
    onDragOver: e => {
      e.preventDefault();
      setOver(true);
    },
    onDragLeave: () => setOver(false),
    onDrop: e => {
      e.preventDefault();
      setOver(false);
      setFile("lab_results_batch_Q3_final.csv");
    },
    onClick: () => setFile("lab_results_batch_Q3_final.csv")
  }, /*#__PURE__*/React.createElement("div", {
    className: "dz-icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "upload-cloud",
    size: 32
  })), file ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "dz-title"
  }, file), /*#__PURE__*/React.createElement("p", {
    className: "dz-sub"
  }, "48 rows detected \xB7 ready to validate")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "dz-title"
  }, "Drop your CSV here"), /*#__PURE__*/React.createElement("p", {
    className: "dz-sub"
  }, "or click to browse \xB7 .csv only \xB7 max 5 MB or 10,000 rows"))), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    disabled: !file || phase === "processing",
    style: {
      width: "100%"
    },
    onClick: run
  }, phase === "processing" ? "Validating…" : "Validate & upload"), /*#__PURE__*/React.createElement("div", {
    className: "hint"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lightbulb",
    size: 16
  }), " Need the template? Download it from the Download Template page.")));
}
Object.assign(window, {
  Upload
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/upload.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/userManagement.jsx
try { (() => {
// Validata UI kit — User Management (admin): instructor accounts + edit drawer.

const INSTRUCTORS = [{
  name: "Sarah Jenkins",
  email: "s.jenkins@organization.com",
  modules: 4,
  status: ["success", "Active"]
}, {
  name: "Michael Chen",
  email: "m.chen@organization.com",
  modules: 2,
  status: ["success", "Active"]
}, {
  name: "Anita Patel",
  email: "a.patel@organization.com",
  modules: 3,
  status: ["success", "Active"]
}, {
  name: "James Wilson",
  email: "j.wilson@organization.com",
  modules: 0,
  status: ["danger", "Inactive"]
}];
const MODULE_GROUPS = [{
  spec: "Data Analytics",
  modules: [{
    code: "DA-01",
    name: "Python Fundamentals",
    on: true
  }, {
    code: "DA-02",
    name: "Data Wrangling",
    on: true
  }, {
    code: "DA-03",
    name: "SQL & Databases",
    on: false
  }, {
    code: "DA-04",
    name: "Visualisation",
    on: false
  }]
}, {
  spec: "Software Engineering",
  modules: [{
    code: "SWE-01",
    name: "Version Control",
    on: false
  }, {
    code: "SWE-02",
    name: "Web Foundations",
    on: false
  }]
}];
function ModuleGroup({
  group
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "mg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mg-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mg-spec"
  }, group.spec), /*#__PURE__*/React.createElement("button", {
    className: "link"
  }, "Select all")), group.modules.map(m => /*#__PURE__*/React.createElement("label", {
    key: m.code,
    className: "mg-row"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    defaultChecked: m.on
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono mg-code"
  }, m.code), /*#__PURE__*/React.createElement("span", {
    className: "mg-name"
  }, m.name))));
}
function UserManagement() {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const openEdit = i => {
    setEditing(i);
    setOpen(true);
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "User management"), /*#__PURE__*/React.createElement("p", {
    className: "page-sub"
  }, "Manage instructor accounts and module assignments.")), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "user-plus",
    onClick: () => {
      setEditing(null);
      setOpen(true);
    }
  }, "Add instructor")), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Name"), /*#__PURE__*/React.createElement("th", null, "Email"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "center"
    }
  }, "Assigned modules"), /*#__PURE__*/React.createElement("th", null, "Status"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right"
    }
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", null, INSTRUCTORS.map((u, i) => /*#__PURE__*/React.createElement("tr", {
    key: u.email
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      fontWeight: 600
    }
  }, u.name), /*#__PURE__*/React.createElement("td", {
    className: "mono",
    style: {
      color: "var(--text-secondary)"
    }
  }, u.email), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: "center"
    }
  }, u.modules), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Pill, {
    tone: u.status[0]
  }, u.status[1])), /*#__PURE__*/React.createElement("td", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "link",
    onClick: () => openEdit(i)
  }, "Edit"))))))), /*#__PURE__*/React.createElement(Drawer, {
    open: open,
    title: editing === null ? "Add instructor" : "Edit instructor",
    subtitle: editing === null ? "Provision a new instructor account." : INSTRUCTORS[editing] && INSTRUCTORS[editing].name,
    onClose: () => setOpen(false),
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setOpen(false)
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      onClick: () => setOpen(false)
    }, "Save changes"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "ff-group-title"
  }, "Account details"), /*#__PURE__*/React.createElement(TextField, {
    label: "Email address",
    value: editing !== null ? (INSTRUCTORS[editing] || {}).email : "",
    placeholder: "name@organization.com",
    hint: "Email cannot be changed after creation.",
    mono: true
  }), /*#__PURE__*/React.createElement("div", {
    className: "ff"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ff-label"
  }, "Account status"), /*#__PURE__*/React.createElement("label", {
    className: "toggle-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "toggle on"
  }, /*#__PURE__*/React.createElement("span", {
    className: "toggle-knob"
  })), /*#__PURE__*/React.createElement("span", null, "Active"))), /*#__PURE__*/React.createElement("div", {
    className: "ff-group-title",
    style: {
      marginTop: 8
    }
  }, "Assigned modules"), /*#__PURE__*/React.createElement("p", {
    className: "ff-hint",
    style: {
      marginTop: -4,
      marginBottom: 4
    }
  }, "Instructors can only upload results for the modules selected here."), MODULE_GROUPS.map(g => /*#__PURE__*/React.createElement(ModuleGroup, {
    key: g.spec,
    group: g
  }))));
}
Object.assign(window, {
  UserManagement
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/userManagement.jsx", error: String((e && e.message) || e) }); }

})();
