import { HABIT_TARGETS } from './config.js';

const HABITS = [
  { key: "seitenGelesen", label: "Seiten gelesen",   unit: "",    color: "#FF375F", negative: false },
  { key: "x",             label: "X",                unit: "",    color: "#FF9F0A", negative: true  },
  { key: "wasser",        label: "Wasser getrunken", unit: "l",   color: "#30D158", negative: false },
  { key: "meditation",    label: "Meditation",       unit: "min", color: "#5AC8FA", negative: false },
];

const RING_RADII   = [120, 90, 60, 30];
const STROKE_WIDTH = 18;
const SVG_SIZE     = 300;
const CENTER_X     = SVG_SIZE / 2;
const CENTER_Y     = SVG_SIZE / 2;
const ARROW_SIZE   = 6;

function calculateProgress(habit, today) {
  const value  = today[habit.key] || 0;
  const target = HABIT_TARGETS[habit.key];
  if (!target) return 0;
  return habit.negative
    ? Math.max(0, 1 - value / target)
    : value / target;
}

function formatNumber(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function renderArrowhead(radius, color, negative) {
  const tipY  = CENTER_Y - radius;
  const backX = negative ? CENTER_X + ARROW_SIZE : CENTER_X - ARROW_SIZE;
  return `<path d="M ${backX},${tipY - ARROW_SIZE} L ${CENTER_X},${tipY} L ${backX},${tipY + ARROW_SIZE}"
    fill="none" stroke="white" stroke-width="2.5"
    stroke-linecap="round" stroke-linejoin="round" />`;
}

const TEXT_DIST = RING_RADII[0] + STROKE_WIDTH / 2 + 24; // always outside outermost ring

function textAtAngle(angleDeg, radius, text, color, lineColor, size = 14) {
  const rad       = (angleDeg - 90) * Math.PI / 180;
  const lineStart = radius + STROKE_WIDTH / 2 + 2;
  const lineEnd   = TEXT_DIST - 7;
  const x1 = CENTER_X + lineStart * Math.cos(rad);
  const y1 = CENTER_Y + lineStart * Math.sin(rad);
  const x2 = CENTER_X + lineEnd   * Math.cos(rad);
  const y2 = CENTER_Y + lineEnd   * Math.sin(rad);
  const x  = CENTER_X + TEXT_DIST * Math.cos(rad);
  const y  = CENTER_Y + TEXT_DIST * Math.sin(rad);
  const anchor = x < CENTER_X - 5 ? 'end' : x > CENTER_X + 5 ? 'start' : 'middle';
  return `
    <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
      stroke="${lineColor}" stroke-width="1" stroke-linecap="round" class="ring-hover-text" />
    <text x="${x.toFixed(1)}" y="${y.toFixed(1)}"
      text-anchor="${anchor}" dominant-baseline="middle"
      class="ring-hover-text" fill="${color}" font-size="${size}"
      font-weight="600" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">${text}</text>`;
}

export function renderRings(today, averages) {
  const rings = HABITS.map((habit, index) => {
    const radius        = RING_RADII[index];
    const circumference = 2 * Math.PI * radius;
    const progress      = calculateProgress(habit, today);
    const isOverflow    = progress > 1;
    const overflowProgress = progress % 1;

    // Clamp to minimum arc length so stroke-linecap="round" always renders a visible dot
    const minimumProgress = 3 / circumference;
    const clampedProgress = Math.max(minimumProgress, isOverflow ? 1 : progress);

    // Base arc: full circle on overflow, otherwise clampedProgress fraction
    const initialDashOffset = habit.negative ? 0 : circumference;
    const targetDashOffset  = isOverflow ? 0 : circumference * (1 - clampedProgress);

    // Overflow arc: second lap drawn on top at reduced opacity
    const overflowDashOffset = isOverflow ? circumference * (1 - overflowProgress) : circumference;

    // Arrow rotation: compensate for stroke-linecap="round" extending the arc visually
    const strokeCapAngle  = (STROKE_WIDTH / 4 / radius) * (180 / Math.PI);
    const arrowProgress   = isOverflow ? overflowProgress : progress;
    const initialRotation = habit.negative ? 360 : 0;
    const targetRotation  = arrowProgress * 360 + strokeCapAngle;

    // Average marker: position of daily average relative to target
    const dailyAverageValue = averages[habit.key] || 0;
    const habitTarget       = HABIT_TARGETS[habit.key];
    const averageProgress   = habit.negative
      ? Math.max(0, 1 - dailyAverageValue / habitTarget)
      : Math.min(1, dailyAverageValue / habitTarget);
    const averageAngle = averageProgress * 360;

    const animationDelay      = index * 0.15;
    const animationTransition = `1s cubic-bezier(0.4,0,0.2,1) ${animationDelay}s`;

    const todayValue   = today[habit.key] || 0;
    const goalAngle    = habit.negative ? 360 : 0;
    const todayText    = textAtAngle(targetRotation, radius, `${formatNumber(todayValue)}${habit.unit}`,           habit.color,              habit.color);
    const avgText      = textAtAngle(averageAngle,   radius, `∅ ${formatNumber(dailyAverageValue)}${habit.unit}`, 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0.4)');
    const goalText     = textAtAngle(goalAngle,      radius, `${formatNumber(habitTarget)}${habit.unit}`,         'rgba(255,255,255,0.3)',  `${habit.color}88`);

    return `
      <g class="ring-group">
        <!-- track -->
        <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${radius}" fill="none"
          stroke="${habit.color}22" stroke-width="${STROKE_WIDTH}" class="ring-track" />
        <!-- base arc -->
        <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${radius}" fill="none"
          stroke="${habit.color}" stroke-width="${STROKE_WIDTH}"
          stroke-dasharray="${circumference}" stroke-dashoffset="${initialDashOffset}"
          stroke-linecap="round"
          transform="rotate(-90 ${CENTER_X} ${CENTER_Y})"
          class="ring-progress ring-arc-base"
          data-final="${targetDashOffset}"
          style="transition: stroke-dashoffset ${animationTransition}" />
        <!-- overflow arc (above target) -->
        <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${radius}" fill="none"
          stroke="${habit.color}" stroke-width="${STROKE_WIDTH}"
          stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}"
          stroke-linecap="round"
          transform="rotate(-90 ${CENTER_X} ${CENTER_Y})"
          class="ring-overflow ring-arc-overflow"
          data-final="${overflowDashOffset}"
          style="opacity:0.55; transition: stroke-dashoffset ${animationTransition}" />
        <!-- transparent hit area for hover -->
        <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${radius}" fill="none"
          stroke="transparent" stroke-width="${STROKE_WIDTH + 16}" class="ring-hit" />
        <!-- daily average marker -->
        <g transform="rotate(${averageAngle} ${CENTER_X} ${CENTER_Y})">
          <line x1="${CENTER_X}" y1="${CENTER_Y - radius - STROKE_WIDTH / 2}"
                x2="${CENTER_X}" y2="${CENTER_Y - radius + STROKE_WIDTH / 2}"
                stroke="white" stroke-width="1.5" stroke-linecap="butt" opacity="0.6" />
        </g>
        <!-- arrow indicator -->
        <g class="ring-indicator"
          data-final-rotate="${targetRotation}"
          style="transform-origin:${CENTER_X}px ${CENTER_Y}px; transform:rotate(${initialRotation}deg);
                 transition: transform ${animationTransition}">
          ${renderArrowhead(radius, habit.color, habit.negative)}
        </g>
        <!-- hover labels -->
        ${todayText}
        ${avgText}
        ${goalText}
      </g>
    `;
  }).join("");

  const labels = HABITS.map((habit) => {
    const value    = today[habit.key] || 0;
    const progress = calculateProgress(habit, today);
    const percentage = Math.round(progress * 100);
    return `
      <div class="ring-label">
        <span class="ring-dot" style="background:${habit.color}"></span>
        <span class="ring-name">${habit.label}</span>
        <span class="ring-stats">
          <span class="ring-value" style="color:${habit.color}">${formatNumber(value)}${habit.unit}</span>
          <span class="ring-avg">/ ${formatNumber(HABIT_TARGETS[habit.key])}${habit.unit}</span>
          <span class="ring-pct">${percentage}%</span>
        </span>
      </div>
    `;
  }).join("");

  const todayDate = new Date().toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long",
  });

  return `
    <div class="rings-container">
      <p class="date-label">${todayDate}</p>
      <svg viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" class="rings-svg">${rings}</svg>
      <div class="rings-labels">${labels}</div>
    </div>
  `;
}

export function renderHistoryGrid(pastDays) {
  if (!pastDays.length) return '';

  const cells = pastDays.map(({ date, totals }) => {
    const label = date.toLocaleDateString("de-DE", { day: "numeric", month: "numeric" });

    const svgContent = HABITS.map((habit, index) => {
      const radius        = RING_RADII[index];
      const circumference = 2 * Math.PI * radius;
      const progress      = calculateProgress(habit, totals);
      const clamped       = Math.min(Math.max(progress, 3 / circumference), 1);
      const dashOffset    = circumference * (1 - clamped);
      return `
        <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${radius}" fill="none"
          stroke="${habit.color}22" stroke-width="${STROKE_WIDTH}" />
        <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="${radius}" fill="none"
          stroke="${habit.color}" stroke-width="${STROKE_WIDTH}"
          stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"
          stroke-linecap="round"
          transform="rotate(-90 ${CENTER_X} ${CENTER_Y})" />`;
    }).join('');

    return `
      <div class="history-cell">
        <svg viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" class="history-svg">${svgContent}</svg>
        <span class="history-date">${label}</span>
      </div>`;
  }).join('');

  return `<div class="history-grid">${cells}</div>`;
}

export function animateRings() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll(".ring-progress").forEach((el) => {
        el.style.strokeDashoffset = el.dataset.final;
      });
      document.querySelectorAll(".ring-overflow").forEach((el) => {
        el.style.strokeDashoffset = el.dataset.final;
      });
      document.querySelectorAll(".ring-indicator").forEach((el) => {
        el.style.transform = `rotate(${el.dataset.finalRotate}deg)`;
      });
    });
  });
}
