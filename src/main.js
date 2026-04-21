import "./style.css";
import { initAuth, login, logout } from "./auth.js";
import { fetchHabitData, getTodayTotals, getDailyAverages, getPast9DaysTotals } from "./sheets.js";
import { renderRings, animateRings, renderHistoryGrid } from "./rings.js";

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
    const data     = await fetchHabitData();
    const today    = getTodayTotals(data);
    const averages = getDailyAverages(data);
    const pastDays = getPast9DaysTotals(data);

    const ringsEl = Object.assign(document.createElement("div"), {
      innerHTML: renderRings(today, averages),
    }).firstElementChild;
    document.getElementById("status").replaceWith(ringsEl);
    animateRings();

    const historyHtml = renderHistoryGrid(pastDays);
    if (historyHtml) {
      const historyEl = Object.assign(document.createElement("div"), {
        innerHTML: historyHtml,
      }).firstElementChild;
      ringsEl.after(historyEl);
    }
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
