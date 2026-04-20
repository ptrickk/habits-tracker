import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { app } from "../firebaseInit.js";
import { setAccessToken } from "./sheets.js";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/spreadsheets.readonly");

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

export async function login() {
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  setAccessToken(credential.accessToken);
}

export function logout() {
  return signOut(auth);
}
