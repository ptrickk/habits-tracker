import { HABITS } from './config.js';

const RING_RADII     = [120, 90, 60, 30];
const STROKE_WIDTH   = 18;
const SVG_SIZE       = 300;
const CENTER_X       = SVG_SIZE / 2;
const CENTER_Y       = SVG_SIZE / 2;
const ARROWHEAD_SIZE = 6;
// Radial distance from center at which hover labels are placed — always outside the outermost ring
const LABEL_RADIUS   = RING_RADII[0] + STROKE_WIDTH / 2 + 24;

function calculateProgress(habit, totals, days = 1) {
  const target = habit.target * days;
  if (!target) return 0;
  const ratio = (totals[habit.key] || 0) / target;
  return habit.inverted ? Math.max(0, 1 - ratio) : ratio;
}

function formatNumber(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function calculateScore(totals, days = 1) {
  const sum = HABITS.reduce((acc, h) => acc + Math.min(calculateProgress(h, totals, days), 1), 0);
  return Math.round((sum / HABITS.length) * 100);
}

function renderArrowhead(ringRadius, inverted) {
  const tipY  = CENTER_Y - ringRadius;
  const backX = inverted ? CENTER_X + ARROWHEAD_SIZE : CENTER_X - ARROWHEAD_SIZE;
  return `<path d="M ${backX},${tipY - ARROWHEAD_SIZE} L ${CENTER_X},${tipY} L ${backX},${tipY + ARROWHEAD_SIZE}"
    fill="none" stroke="white" stroke-width="2.5"
    stroke-linecap="round" stroke-linejoin="round" />`;
}

// Renders a connector line + text label at a given angle on the ring, used for hover overlays.
function renderLabelAtAngle(angleDeg, ringRadius, labelText, textColor, lineColor, fontSize = 14) {
  const angleRad      = (angleDeg - 90) * Math.PI / 180;
  const lineStartDist = ringRadius + STROKE_WIDTH / 2 + 2;
  const lineEndDist   = LABEL_RADIUS - 7;
  const x1 = CENTER_X + lineStartDist * Math.cos(angleRad);
  const y1 = CENTER_Y + lineStartDist * Math.sin(angleRad);
  const x2 = CENTER_X + lineEndDist   * Math.cos(angleRad);
  const y2 = CENTER_Y + lineEndDist   * Math.sin(angleRad);
  const labelX = CENTER_X + LABEL_RADIUS * Math.cos(angleRad);
  const labelY = CENTER_Y + LABEL_RADIUS * Math.sin(angleRad);
  const textAnchor = labelX < CENTER_X - 5 ? 'end' : labelX > CENTER_X + 5 ? 'start' : 'middle';
  return `
    <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
      stroke="${lineColor}" stroke-width="1" stroke-linecap="round" class="ring-hover-text" />
    <text x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}"
      text-anchor="${textAnchor}" dominant-baseline="middle"
      class="ring-hover-text" fill="${textColor}" font-size="${fontSize}"
      font-weight="600" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">${labelText}</text>`;
}

function buildRingsSvg(progressFn) {
  return HABITS.map((habit, index) => {
    const ringRadius    = RING_RADII[index];
    const circumference = 2 * Math.PI * ringRadius;
    const clamped       = Math.min(Math.max(progressFn(habit), 3 / circumference), 1);
    const dashOffset    = circumference * (1 - clamped);
    return `
      <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${ringRadius}" fill="none"
        stroke="${habit.color}22" stroke-width="${STROKE_WIDTH}" class="history-track" />
      <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${ringRadius}" fill="none"
        stroke="${habit.color}" stroke-width="${STROKE_WIDTH}"
        stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"
        stroke-linecap="round"
        transform="rotate(-90 ${CENTER_X} ${CENTER_Y})" class="history-arc" />`;
  }).join('');
}

function buildTooltipRows(totals, progressFn) {
  return HABITS.map((habit) => {
    const value      = totals[habit.key] || 0;
    const percentage = Math.round(Math.min(progressFn(habit), 1) * 100);
    return `
      <div class="ht-row">
        <span class="ht-dot" style="background:${habit.color}"></span>
        <span class="ht-name">${habit.label.split(' ')[0]}</span>
        <span class="ht-val" style="color:${habit.color}">${formatNumber(value)}${habit.unit}</span>
        <span class="ht-pct">${percentage}%</span>
      </div>`;
  }).join('');
}

export function renderRings(today, averages) {
  const ringsHtml = HABITS.map((habit, index) => {
    const ringRadius    = RING_RADII[index];
    const circumference = 2 * Math.PI * ringRadius;
    const progress      = calculateProgress(habit, today);
    const isOverflow    = progress > 1;
    const secondLapProgress = progress % 1;

    // Clamp to a minimum arc so stroke-linecap="round" always renders a visible dot
    const minimumProgress = 3 / circumference;
    const clampedProgress = Math.max(minimumProgress, isOverflow ? 1 : progress);

    // Inverted habits start at full (offset=0) and shrink; normal habits start empty and grow
    const startDashOffset  = habit.inverted ? 0 : circumference;
    const targetDashOffset = isOverflow ? 0 : circumference * (1 - clampedProgress);

    // Overflow arc: a second lap drawn on top at reduced opacity
    const overflowDashOffset = isOverflow ? circumference * (1 - secondLapProgress) : circumference;

    // Arrow angle compensates for the visual extension caused by stroke-linecap="round"
    const strokeCapAngle = (STROKE_WIDTH / 4 / ringRadius) * (180 / Math.PI);
    const arrowFraction  = isOverflow ? secondLapProgress : progress;
    const startRotation  = habit.inverted ? 360 : 0;
    const targetRotation = arrowFraction * 360 + strokeCapAngle;

    const habitAverage = averages[habit.key] || 0;
    const avgFraction  = habit.inverted
      ? Math.max(0, 1 - habitAverage / habit.target)
      : Math.min(1, habitAverage / habit.target);
    const avgAngle = avgFraction * 360;

    const transition = `1s cubic-bezier(0.4,0,0.2,1) ${index * 0.15}s`;

    const todayValue = today[habit.key] || 0;
    const goalAngle  = habit.inverted ? 360 : 0;
    const todayLabel = renderLabelAtAngle(targetRotation, ringRadius, `${formatNumber(todayValue)}${habit.unit}`,          habit.color,              habit.color);
    const avgLabel   = renderLabelAtAngle(avgAngle,       ringRadius, `∅ ${formatNumber(habitAverage)}${habit.unit}`,      'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.4)');
    const goalLabel  = renderLabelAtAngle(goalAngle,      ringRadius, `${formatNumber(habit.target)}${habit.unit}`,        'rgba(255,255,255,0.3)',  `${habit.color}88`);

    // Encode the 1° offset directly in cx/cy to avoid SVG transform attribute, which prevents CSS r-property transitions
    const shadowCx = (CENTER_X + ringRadius * Math.sin(Math.PI / 180)).toFixed(2);
    const shadowCy = (CENTER_Y - ringRadius * Math.cos(Math.PI / 180)).toFixed(2);

    return `
      <g class="ring-group" data-habit="${habit.key}" data-color="${habit.color}">
        <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${ringRadius}" fill="none"
          stroke="${habit.color}22" stroke-width="${STROKE_WIDTH}" class="ring-track" />
        <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${ringRadius}" fill="none"
          stroke="${habit.color}" stroke-width="${STROKE_WIDTH}"
          stroke-dasharray="${circumference}" stroke-dashoffset="${startDashOffset}"
          stroke-linecap="round"
          transform="rotate(-90 ${CENTER_X} ${CENTER_Y})"
          class="ring-progress ring-arc-base"
          data-final="${targetDashOffset}"
          style="transition: stroke-dashoffset ${transition}" />
        <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${ringRadius}" fill="none"
          stroke="${habit.color}" stroke-width="${STROKE_WIDTH}"
          stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
          stroke-linecap="round"
          transform="rotate(-90 ${CENTER_X} ${CENTER_Y})"
          class="ring-overflow ring-arc-overflow"
          data-final="${overflowDashOffset}"
          style="opacity:0.55; transition: stroke-dashoffset ${transition}" />
        <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${ringRadius}" fill="none"
          stroke="transparent" stroke-width="${STROKE_WIDTH + 16}" class="ring-hit" />
        <g transform="rotate(${avgAngle} ${CENTER_X} ${CENTER_Y})">
          <line x1="${CENTER_X}" y1="${CENTER_Y - ringRadius - STROKE_WIDTH / 2}"
                x2="${CENTER_X}" y2="${CENTER_Y - ringRadius + STROKE_WIDTH / 2}"
                stroke="white" stroke-width="1.5" stroke-linecap="butt" opacity="0.6" />
        </g>
        <g class="ring-indicator"
          data-final-rotate="${targetRotation}"
          style="transform-origin:${CENTER_X}px ${CENTER_Y}px; transform:rotate(${startRotation}deg);
                 transition: transform ${transition}">
          ${isOverflow ? `
            <circle cx="${shadowCx}" cy="${shadowCy}" r="${STROKE_WIDTH / 2}"
              fill="rgba(0,0,0,0.6)"
              class="ring-cap-shadow" />
            <circle cx="${CENTER_X}" cy="${CENTER_Y - ringRadius}" r="${STROKE_WIDTH / 2}"
              fill="${habit.color}"
              class="ring-cap" />
          ` : ''}
          ${renderArrowhead(ringRadius, habit.inverted)}
        </g>
        ${todayLabel}
        ${avgLabel}
        ${goalLabel}
      </g>
    `;
  }).join("");

  const labelsHtml = HABITS.map((habit) => {
    const value      = today[habit.key] || 0;
    const percentage = Math.round(calculateProgress(habit, today) * 100);
    return `
      <div class="ring-label" data-habit="${habit.key}">
        <span class="ring-dot" style="background:${habit.color}"></span>
        <span class="ring-name">${habit.label}</span>
        <span class="ring-stats">
          <span class="ring-value" style="color:${habit.color}">${formatNumber(value)}${habit.unit}</span>
          <span class="ring-avg">/ ${formatNumber(habit.target)}${habit.unit}</span>
          <span class="ring-pct">${percentage}%</span>
        </span>
      </div>
    `;
  }).join("");

  const todayDate  = new Date().toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
  const dailyScore = calculateScore(today);

  return `
    <div class="rings-container">
      <p class="date-label">${todayDate}</p>
      <svg viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" class="rings-svg">${ringsHtml}</svg>
      <div class="score-card">
        <span class="score-value">${dailyScore}%</span>
        <span class="score-label">Daily Score</span>
      </div>
      <div class="rings-labels">${labelsHtml}</div>
    </div>
  `;
}

export function renderHistoryGrid(pastDays) {
  if (!pastDays.length) return '';

  const cellsHtml = pastDays.map(({ date, totals }) => {
    const progressFn      = (habit) => calculateProgress(habit, totals);
    const ringsSvg        = buildRingsSvg(progressFn);
    const tooltipRowsHtml = buildTooltipRows(totals, progressFn);
    const tooltipDate     = date.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });
    const dateLabel       = date.toLocaleDateString("de-DE", { day: "numeric", month: "numeric" });
    const dailyScore      = calculateScore(totals);

    return `
      <div class="history-cell">
        <div class="history-tooltip">
          <div class="ht-header">
            <span>${tooltipDate}</span>
            <span class="ht-score">${dailyScore}%</span>
          </div>
          ${tooltipRowsHtml}
        </div>
        <svg viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" class="history-svg">${ringsSvg}</svg>
        <div class="history-meta">
          <span class="history-date">${dateLabel}</span>
          <span class="history-score">${dailyScore}%</span>
        </div>
      </div>`;
  }).join('');

  return `<div class="history-grid">${cellsHtml}</div>`;
}

export function renderSummaryGrid(spans) {
  if (!spans.length) return '';

  const cellsHtml = spans.map(({ label, totals, days }) => {
    const progressFn      = (habit) => calculateProgress(habit, totals, days);
    const ringsSvg        = buildRingsSvg(progressFn);
    const tooltipRowsHtml = buildTooltipRows(totals, progressFn);
    const spanScore       = calculateScore(totals, days);

    return `
      <div class="history-cell">
        <div class="history-tooltip">
          <div class="ht-header">
            <span>${label}</span>
            <span class="ht-score">${spanScore}%</span>
          </div>
          ${tooltipRowsHtml}
        </div>
        <svg viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" class="history-svg">${ringsSvg}</svg>
        <div class="history-meta">
          <span class="history-date">${label}</span>
          <span class="history-score">${spanScore}%</span>
        </div>
      </div>`;
  }).join('');

  return `<div class="summary-grid">${cellsHtml}</div>`;
}

export function wireRingHover() {
  document.querySelectorAll(".ring-group[data-habit]").forEach((ringGroup) => {
    const labelCard = document.querySelector(`.ring-label[data-habit="${ringGroup.dataset.habit}"]`);
    if (!labelCard) return;

    const toggle = (on) => {
      labelCard.classList.toggle("ring-label--active", on);
      if (on) labelCard.style.setProperty("--ring-color", ringGroup.dataset.color);
      ringGroup.classList.toggle("ring-group--active", on);
    };
    [ringGroup, labelCard].forEach(el => {
      el.addEventListener("mouseenter", () => toggle(true));
      el.addEventListener("mouseleave", () => toggle(false));
    });
  });
}

export function animateRings() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll(".ring-progress, .ring-overflow").forEach((el) => {
        el.style.strokeDashoffset = el.dataset.final;
      });
      document.querySelectorAll(".ring-indicator").forEach((el) => {
        el.style.transform = `rotate(${el.dataset.finalRotate}deg)`;
      });
    });
  });
}
