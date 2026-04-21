import { HABIT_TARGETS } from './config.js';

const HABITS = [
  { key: "seitenGelesen", label: "Seiten gelesen", unit: "S", color: "#FF375F", negative: false },
  { key: "x",             label: "X",      unit: "",  color: "#FF9F0A", negative: true  },
  { key: "wasser",        label: "Wasser getrunken", unit: "L", color: "#30D158", negative: false },
  { key: "meditation",    label: "Meditation", unit: "",  color: "#5AC8FA", negative: false },
];

const RADII = [120, 90, 60, 30];
const STROKE = 18;
const SIZE = 300;
const CX = SIZE / 2;
const CY = SIZE / 2;
const ARROW = 6;

function getProgress(habit, today) {
  const val = today[habit.key] || 0;
  const target = HABIT_TARGETS[habit.key];
  if (!target) return 0;
  return habit.negative
    ? Math.max(0, 1 - val / target)
    : val / target;
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function arrowhead(r, color, negative) {
  const ty = CY - r;
  const backX = negative ? CX + ARROW : CX - ARROW;
  return `<path d="M ${backX},${ty - ARROW} L ${CX},${ty} L ${backX},${ty + ARROW}"
    fill="none" stroke="white" stroke-width="2.5"
    stroke-linecap="round" stroke-linejoin="round" />`;
}

export function renderRings(today, averages) {
  const rings = HABITS.map((habit, i) => {
    const r = RADII[i];
    const circ = 2 * Math.PI * r;
    const progress = getProgress(habit, today);
    const overflow = progress > 1;
    const overflowFraction = progress % 1;

    // Minimum visible arc so rounded linecap always renders a dot
    const minProgress = 3 / circ;
    const visibleProgress = Math.max(minProgress, overflow ? 1 : progress);

    // Base arc: if overflow, draw full circle; else draw visibleProgress
    const finalOffset = overflow ? 0 : circ * (1 - visibleProgress);
    const startOffset = habit.negative ? 0 : circ;

    // Overflow arc: draws on top, 0 → overflowFraction
    const overflowFinalOffset = overflow ? circ * (1 - overflowFraction) : circ;

    // Arrow angle: position within current lap
    // +capAngleDeg compensates for stroke-linecap="round" extending the arc visually
    const capAngleDeg = (STROKE / 4 / r) * (180 / Math.PI);
    const arrowFraction = overflow ? overflowFraction : progress;
    const startRotate = habit.negative ? 360 : 0;
    const finalRotate = arrowFraction * 360 + capAngleDeg;

    // Average marker position on ring
    const avgVal = averages[habit.key] || 0;
    const target = HABIT_TARGETS[habit.key];
    const avgProgress = habit.negative
      ? Math.max(0, 1 - avgVal / target)
      : Math.min(1, avgVal / target);
    const avgAngle = avgProgress * 360;

    const delay = i * 0.15;
    const transition = `1s cubic-bezier(0.4,0,0.2,1) ${delay}s`;

    return `
      <!-- track -->
      <circle cx="${CX}" cy="${CY}" r="${r}" fill="none"
        stroke="${habit.color}22" stroke-width="${STROKE}" />
      <!-- base arc -->
      <circle cx="${CX}" cy="${CY}" r="${r}" fill="none"
        stroke="${habit.color}" stroke-width="${STROKE}"
        stroke-dasharray="${circ}" stroke-dashoffset="${startOffset}"
        stroke-linecap="round"
        transform="rotate(-90 ${CX} ${CY})"
        class="ring-progress"
        data-final="${finalOffset}"
        style="transition: stroke-dashoffset ${transition}" />
      <!-- overflow arc (above target) -->
      <circle cx="${CX}" cy="${CY}" r="${r}" fill="none"
        stroke="${habit.color}" stroke-width="${STROKE}"
        stroke-dasharray="${circ}" stroke-dashoffset="${circ}"
        stroke-linecap="round"
        transform="rotate(-90 ${CX} ${CY})"
        class="ring-overflow"
        data-final="${overflowFinalOffset}"
        style="opacity:0.55; transition: stroke-dashoffset ${transition}" />
      <!-- daily average marker -->
      <g transform="rotate(${avgAngle} ${CX} ${CY})">
        <line x1="${CX}" y1="${CY - r - STROKE / 2}"
              x2="${CX}" y2="${CY - r + STROKE / 2}"
              stroke="white" stroke-width="1.5" stroke-linecap="butt" opacity="0.6" />
      </g>
      <!-- arrow indicator -->
      <g class="ring-indicator"
        data-final-rotate="${finalRotate}"
        style="transform-origin:${CX}px ${CY}px; transform:rotate(${startRotate}deg);
               transition: transform ${transition}">
        ${arrowhead(r, habit.color, habit.negative)}
      </g>
    `;
  }).join("");

  const labels = HABITS.map((habit) => {
    const val = today[habit.key] || 0;
    const avg = averages[habit.key] || 0;
    const progress = getProgress(habit, today);
    const pct = Math.round(progress * 100);
    return `
      <div class="ring-label">
        <span class="ring-dot" style="background:${habit.color}"></span>
        <span class="ring-name">${habit.label}</span>
        <span class="ring-stats">
          <span class="ring-value" style="color:${habit.color}">${fmt(val)}${habit.unit}</span>
          <span class="ring-avg">/ ${fmt(avg)}${habit.unit}</span>
          <span class="ring-pct">${pct}%</span>
        </span>
      </div>
    `;
  }).join("");

  const today_date = new Date().toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long",
  });

  return `
    <div class="rings-container">
      <p class="date-label">${today_date}</p>
      <svg viewBox="0 0 ${SIZE} ${SIZE}" class="rings-svg">${rings}</svg>
      <div class="rings-labels">${labels}</div>
    </div>
  `;
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
