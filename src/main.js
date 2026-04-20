import { initAuth, login, logout } from "./auth.js";
import { fetchHabitData, getTodayTotals, getDailyAverages } from "./sheets.js";

initAuth(
  (user) => renderApp(user),
  (errorMsg) => renderLogin(errorMsg)
);

async function renderApp(user) {
  document.getElementById("app").innerHTML = `
    <div style="padding: 2rem;">
      <p>Logged in as ${user.email}</p>
      <button id="logout-btn">Logout</button>
      <p id="status">Loading habit data...</p>
    </div>
  `;
  document.getElementById("logout-btn").addEventListener("click", logout);

  try {
    const data = await fetchHabitData();
    const today = getTodayTotals(data);
    const averages = getDailyAverages(data);
    console.log("Today:", today);
    console.log("Averages:", averages);
    document.getElementById("status").textContent = "Data loaded. Check console.";
  } catch (err) {
    if (err.message === "No access token") {
      document.getElementById("status").innerHTML = `
        <p>Session expired. <button id="reconnect-btn">Reconnect Google Sheets</button></p>
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
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh;">
      ${errorMsg ? `<p style="color:red;">${errorMsg}</p>` : ""}
      <button id="login-btn">Sign in with Google</button>
    </div>
  `;
  document.getElementById("login-btn").addEventListener("click", login);
}
