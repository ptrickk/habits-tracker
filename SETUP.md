 Project Setup Summary — HabitsTracker

  ---
  1. Firebase Project
  - Created project habitstracker-4be68 at console.firebase.google.com
  - Enabled Google Authentication (Sign-in method → Google → Enable)

  2. Firebase CLI
  npm install -g firebase-tools
  firebase login
  firebase init
  - Selected: Hosting (static)
  - Public dir: public (later changed to dist)
  - Single-page app: Yes
  - GitHub Actions auto-deploy: Yes → linked ptrickk/habits-tracker

  3. GitHub Repo
  - Created ptrickk/habits-tracker
  - Firebase CLI uploaded service account as secret
  FIREBASE_SERVICE_ACCOUNT_HABITSTRACKER_4BE68

  4. Vite
  npm install --save-dev vite
  npm install firebase
  - Added "type": "module" and build/dev scripts to package.json
  - index.html moved to project root (Vite entry point)
  - firebase.json public dir changed from public → dist

  5. Firebase Config → Env Vars
  - Created .env with all VITE_FIREBASE_* keys
  - firebaseInit.js updated to use import.meta.env.*
  - Added all 7 secrets to GitHub → Settings → Secrets → Actions
  - Both workflow files updated to pass secrets as env vars during build

  6. Google Sheets API
  - Enabled "Google Sheets API" at console.cloud.google.com → project habitstracker-4be68 →   
  APIs & Services → Library

  7. Auth + Sheets Integration
  - src/auth.js: Google login, email whitelist (patrickgamedt@gmail.com), Sheets read scope   
  - src/sheets.js: fetches sheet 13OU6OkVxOOgMgfmvHpu2FGLrYy7uTBoWxb9L0_yOAq0, parses German  
  decimals, computes today totals + daily averages
  - Access token stored in sessionStorage