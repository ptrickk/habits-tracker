const SPREADSHEET_ID = "13OU6OkVxOOgMgfmvHpu2FGLrYy7uTBoWxb9L0_yOAq0";
const SHEET_NAME = "Entries";
const RANGE = `${SHEET_NAME}!A:E`;

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
  const [header, ...rows] = json.values;

  return rows.map((row) => ({
    timestamp: new Date(row[0]),
    seitenGelesen: parseGermanFloat(row[1]),
    x: parseGermanFloat(row[2]),
    wasser: parseGermanFloat(row[3]),
    meditation: parseGermanFloat(row[4]),
  }));
}

export function getTodayTotals(data) {
  const today = new Date().toDateString();
  const todayRows = data.filter((r) => r.timestamp.toDateString() === today);
  return sumRows(todayRows);
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

  return {
    seitenGelesen: dailyTotals.reduce((s, d) => s + d.seitenGelesen, 0) / n,
    x: dailyTotals.reduce((s, d) => s + d.x, 0) / n,
    wasser: dailyTotals.reduce((s, d) => s + d.wasser, 0) / n,
    meditation: dailyTotals.reduce((s, d) => s + d.meditation, 0) / n,
  };
}

function sumRows(rows) {
  return rows.reduce(
    (acc, r) => ({
      seitenGelesen: acc.seitenGelesen + r.seitenGelesen,
      x: acc.x + r.x,
      wasser: acc.wasser + r.wasser,
      meditation: acc.meditation + r.meditation,
    }),
    { seitenGelesen: 0, x: 0, wasser: 0, meditation: 0 }
  );
}

function parseGermanFloat(val) {
  if (!val) return 0;
  return parseFloat(String(val).replace(",", ".")) || 0;
}
