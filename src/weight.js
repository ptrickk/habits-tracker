const W = 300;
const H = 160;
const PAD = { top: 12, right: 12, bottom: 28, left: 38 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

export function renderWeightChart(weightData) {
  if (!weightData || weightData.length < 2) return null;

  const weights = weightData.map(d => d.weight);
  const rawMin  = Math.min(...weights);
  const rawMax  = Math.max(...weights);
  const yPad    = (rawMax - rawMin) * 0.10 || 1;
  const yMin    = rawMin - yPad;
  const yMax    = rawMax + yPad;

  const t0 = weightData[0].date.getTime();
  const t1 = weightData[weightData.length - 1].date.getTime();
  const tSpan = t1 - t0 || 1;

  const toX = date => PAD.left + ((date.getTime() - t0) / tSpan) * PLOT_W;
  const toY = w    => PAD.top  + PLOT_H - ((w - yMin) / (yMax - yMin)) * PLOT_H;

  const yLabels = [
    { val: rawMax, y: toY(rawMax) },
    { val: (rawMin + rawMax) / 2, y: toY((rawMin + rawMax) / 2) },
    { val: rawMin, y: toY(rawMin) },
  ];

  const FONT    = `-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`;
  const fmtDate = d => d.date.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric', year: '2-digit' });

  const gridLines = yLabels.map(({ y }) =>
    `<line x1="${PAD.left}" y1="${y.toFixed(1)}" x2="${W - PAD.right}" y2="${y.toFixed(1)}" stroke="#1a1a1a" stroke-width="1" />`
  ).join('');

  const yAxisLabels = yLabels.map(({ val, y }) =>
    `<text x="${PAD.left - 5}" y="${y.toFixed(1)}" text-anchor="end" dominant-baseline="middle" fill="#555" font-size="9" font-family="${FONT}">${val.toFixed(1)}</text>`
  ).join('');

  const points = weightData
    .map(d => `${toX(d.date).toFixed(1)},${toY(d.weight).toFixed(1)}`)
    .join(' ');

  const polyline = `<polyline points="${points}" fill="none" stroke="#BF5AF2" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />`;

  const dots = weightData.map(d => {
    const x = toX(d.date);
    const y = toY(d.weight);
    // flip tooltip below the dot when it's near the top of the plot area
    const tipAbove  = y > 44;
    const rectY     = tipAbove ? -36 : 8;
    const textY1    = tipAbove ? -25 : 19;
    const textY2    = tipAbove ? -13 : 31;
    return `<g class="dot-group">
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="transparent" />
      <circle class="dot-circle" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="#BF5AF2" />
      <g class="dot-tip" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
        <rect x="-26" y="${rectY}" width="52" height="28" rx="5" fill="#1a1a1a" stroke="#2a2a2a" stroke-width="1" />
        <text y="${textY1}" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="9.5" font-family="${FONT}">${d.weight.toFixed(1)} kg</text>
        <text y="${textY2}" text-anchor="middle" dominant-baseline="middle" fill="#555" font-size="8" font-family="${FONT}">${fmtDate(d)}</text>
      </g>
    </g>`;
  }).join('');

  const first = weightData[0];
  const last  = weightData[weightData.length - 1];

  const xLabels =
    `<text x="${toX(first.date).toFixed(1)}" y="${H - 6}" text-anchor="start" fill="#555" font-size="9" font-family="${FONT}">${fmtDate(first)}</text>` +
    `<text x="${toX(last.date).toFixed(1)}"  y="${H - 6}" text-anchor="end"   fill="#555" font-size="9" font-family="${FONT}">${fmtDate(last)}</text>`;

  const wrapper = document.createElement('div');
  wrapper.className = 'weight-chart';
  wrapper.innerHTML = `
    <p class="weight-chart__title">Gewicht</p>
    <svg viewBox="0 0 ${W} ${H}" class="weight-chart__svg">
      ${gridLines}
      ${yAxisLabels}
      ${polyline}
      ${dots}
      ${xLabels}
    </svg>
  `;
  return wrapper;
}
