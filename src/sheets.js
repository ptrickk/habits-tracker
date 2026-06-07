import { HABITS } from './config.js';

const SPREADSHEET_ID = "13OU6OkVxOOgMgfmvHpu2FGLrYy7uTBoWxb9L0_yOAq0";
const SHEET_NAME = "Entries";
const RANGE = `${SHEET_NAME}!A:F`;

export function setAccessToken(token) {
  sessionStorage.setItem("gAccessToken", token);
}

function getAccessToken() {
  return sessionStorage.getItem("gAccessToken");
}

export async function fetchHabitData() {
  const token = getAccessToken();
  if (!token) throw new Error("No access token");

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Sheets API error: ${res.status}`);

  const json = await res.json();
  const [, ...rows] = json.values;

  return rows.map((row) => ({
    timestamp: new Date(row[0]),
    seitenGelesen: parseGermanFloat(row[1]),
    x: parseGermanFloat(row[2]),
    wasser: parseGermanFloat(row[3]),
    meditation: parseGermanFloat(row[4]),
    weight: parseGermanFloat(row[5]),
  }));
}

export function getTodayTotals(data) {
  const today = new Date().toDateString();
  return sumRows(data.filter((r) => r.timestamp.toDateString() === today));
}

export function getDailyAverages(data) {
  const byDay = {};
  for (const row of data) {
    const key = row.timestamp.toDateString();
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(row);
  }
  const dailyTotals = Object.values(byDay).map(sumRows);
  const n = dailyTotals.length || 1;
  return Object.fromEntries(HABITS.map(({ key }) => [key, dailyTotals.reduce((s, d) => s + d[key], 0) / n]));
}

export function getPast9DaysTotals(data) {
  const today = new Date().toDateString();
  const byDay = {};
  for (const row of data) {
    const key = row.timestamp.toDateString();
    if (key === today) continue;
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(row);
  }
  return Object.entries(byDay)
    .sort(([a], [b]) => new Date(b) - new Date(a))
    .slice(0, 9)
    .map(([key, rows]) => ({ date: new Date(key), totals: sumRows(rows) }));
}

function aggregateFromDate(data, from, days) {
  return { totals: sumRows(data.filter(r => r.timestamp >= from)), days };
}

export function getSpanTotals(data, nDays) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - nDays + 1);
  cutoff.setHours(0, 0, 0, 0);
  return aggregateFromDate(data, cutoff, nDays);
}

export function getYearToDateTotals(data) {
  const today = new Date();
  const jan1  = new Date(today.getFullYear(), 0, 1);
  return aggregateFromDate(data, jan1, Math.round((today - jan1) / 86400000) + 1);
}

export function getAllTimeTotals(data) {
  if (!data.length) return { totals: sumRows([]), days: 1 };
  const first = new Date(Math.min(...data.map(r => r.timestamp.getTime())));
  first.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return aggregateFromDate(data, first, Math.round((today - first) / 86400000) + 1);
}

function sumRows(rows) {
  const zero = Object.fromEntries(HABITS.map(h => [h.key, 0]));
  return rows.reduce((acc, r) => Object.fromEntries(HABITS.map(({ key }) => [key, acc[key] + r[key]])), zero);
}

export function getWeightByDate(data) {
  const byDay = {};
  for (const row of data) {
    if (row.weight === 0) continue;
    const key = row.timestamp.toDateString();
    byDay[key] = { date: new Date(key), weight: row.weight };
  }
  return Object.values(byDay).sort((a, b) => a.date - b.date);
}

function parseGermanFloat(val) {
  if (!val) return 0;
  return parseFloat(String(val).replace(",", ".")) || 0;
}
