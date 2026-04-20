import { initAuth, login, logout } from "./auth.js";

initAuth(
  (user) => renderApp(user),
  (errorMsg) => renderLogin(errorMsg)
);

function renderApp(user) {
  document.getElementById("app").innerHTML = `
    <div style="padding: 2rem;">
      <p>Logged in as ${user.email}</p>
      <button id="logout-btn">Logout</button>
      <h1>Habits Tracker</h1>
    </div>
  `;
  document.getElementById("logout-btn").addEventListener("click", logout);
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
