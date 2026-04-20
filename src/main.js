import { app } from "../firebaseInit.js";

console.log("Firebase app initialized:", app.name);

document.getElementById("app").innerHTML = `<h1>Habits Tracker</h1>`;
