import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { app } from "../firebaseInit.js";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const ALLOWED_EMAIL = "patrickgamedt@gmail.com";

export function initAuth(onAuthorized, onUnauthorized) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (user.email === ALLOWED_EMAIL) {
        onAuthorized(user);
      } else {
        signOut(auth);
        onUnauthorized("Access denied.");
      }
    } else {
      onUnauthorized(null);
    }
  });
}

export function login() {
  return signInWithPopup(auth, provider);
}

export function logout() {
  return signOut(auth);
}
