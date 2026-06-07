import "./style.css";
import { initAuth, login, logout } from "./auth.js";
import { fetchHabitData, getTodayTotals, getDailyAverages, getPast9DaysTotals, getSpanTotals, getYearToDateTotals, getAllTimeTotals, getWeightByDate } from "./sheets.js";
import { renderRings, animateRings, wireRingHover, renderHistoryGrid, renderSummaryGrid } from "./rings.js";
import { renderWeightChart } from "./weight.js";

const htmlToElement = html => Object.assign(document.createElement("div"), { innerHTML: html }).firstElementChild;

initAuth(
  (user) => renderApp(user),
  (errorMsg) => renderLogin(errorMsg)
);

async function renderApp(user) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="header">
      <h1>Habits</h1>
      <button class="logout-btn" id="logout-btn">Logout</button>
    </div>
    <p class="status-msg" id="status">Loading...</p>
  `;
  document.getElementById("logout-btn").addEventListener("click", logout);

  try {
    const data       = await fetchHabitData();
    const today      = getTodayTotals(data);
    const averages   = getDailyAverages(data);
    const pastDays   = getPast9DaysTotals(data);
    const weightData = getWeightByDate(data);

    const ringsEl = htmlToElement(renderRings(today, averages));
    document.getElementById("status").replaceWith(ringsEl);
    animateRings();
    wireRingHover();

    const historyHtml = renderHistoryGrid(pastDays);
    let lastEl = ringsEl;
    if (historyHtml) {
      const historyEl = htmlToElement(historyHtml);
      ringsEl.after(historyEl);
      lastEl = historyEl;
    }

    const spans = [
      { label: '7 Tage',      ...getSpanTotals(data, 7)     },
      { label: '30 Tage',     ...getSpanTotals(data, 30)    },
      { label: 'Dieses Jahr', ...getYearToDateTotals(data)  },
      { label: 'Gesamt',      ...getAllTimeTotals(data)      },
    ];
    const summaryHtml = renderSummaryGrid(spans);
    if (summaryHtml) {
      const summaryEl = htmlToElement(summaryHtml);
      lastEl.after(summaryEl);
      lastEl = summaryEl;
    }

    const weightChartEl = renderWeightChart(weightData);
    if (weightChartEl) lastEl.after(weightChartEl);
  } catch (err) {
    if (err.message === "No access token" || err.message.includes("401")) {
      document.getElementById("status").innerHTML = `
        <button class="reconnect-btn" id="reconnect-btn">Reconnect Google Sheets</button>
      `;
      document.getElementById("reconnect-btn").addEventListener("click", async () => {
        await login();
        renderApp(user);
      });
    } else {
      document.getElementById("status").textContent = `Error: ${err.message}`;
    }
  }
}

function renderLogin(errorMsg) {
  document.getElementById("app").innerHTML = `
    <div class="login-screen">
      <h1>Habits</h1>
      ${errorMsg ? `<p class="error-msg">${errorMsg}</p>` : ""}
      <button class="login-btn" id="login-btn">Sign in with Google</button>
    </div>
  `;
  document.getElementById("login-btn").addEventListener("click", login);
}
