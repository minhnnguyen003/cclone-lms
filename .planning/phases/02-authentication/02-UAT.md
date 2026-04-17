---
status: complete
phase: 02-authentication
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md]
started: 2026-04-17T08:00:00Z
updated: 2026-04-17T09:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state. Start both backend and frontend from scratch. Backend boots without errors (no MODULE_NOT_FOUND, no TS errors, no DB connection failures). Frontend dev server starts and the app loads at http://localhost:5174 without console errors. Navigating to / redirects to /dashboard which then redirects to /login (PrivateRoute working).
result: issue
reported: "Warning: Invalid input options (1 issue found) - For the 'jsx'. Invalid key: Expected never but received 'jsx'. Backend started clean (0 errors, all routes mapped)."
severity: minor

### 2. Sign Up — new user
expected: Go to http://localhost:5174/signup. Fill in full name, a valid email, and a password meeting all 6 conditions (8+ chars, uppercase, number, symbol, no sequential digits, no repeating chars). The 6-condition password checklist shows green checkmarks as each condition is met in real time. Submit. You are redirected to /dashboard and the sidebar shows your name and email.
result: pass

### 3. Password Checklist — real-time validation
expected: On the signup page, type in the password field. As you type, the checklist updates immediately — each condition turns green (Check icon) when met and stays red (X icon) when not met. All 6 conditions start red and turn green without submitting the form.
result: pass

### 4. Duplicate Email — 409 handling
expected: On the signup page, try to register with an email already in the database. You should see an alert: "An account with this email already exists. Sign in instead?" with a link to /login. No redirect occurs.
result: pass

### 5. Log In
expected: Go to http://localhost:5174/login. Enter valid credentials. Submit. You are redirected to /dashboard. The sidebar shows your name and email with an initials avatar.
result: pass

### 6. Invalid Login — wrong password
expected: On the login page, enter a valid email with a wrong password. The form shows a red alert: "Invalid email or password. Please try again." No redirect occurs, the form stays on /login.
result: pass
note: fixed — axios interceptor now excludes /auth/login from 401 retry logic

### 7. Session Hydration — refresh on app mount
expected: Log in, then close the browser tab (do NOT log out). Reopen http://localhost:5174. You should land on /dashboard still logged in — the app silently restored your session via the refresh token cookie without showing the login page.
result: pass

### 8. Private Route Redirect — unauthenticated
expected: Clear cookies (or open a private/incognito window). Navigate directly to http://localhost:5174/dashboard. You should be redirected to /login?next=%2Fdashboard. After logging in, you should land on /dashboard (the ?next= redirect works).
result: pass

### 9. Log Out
expected: While logged in, click the Logout button in the sidebar. You are redirected to /login. If you then navigate back to /dashboard, you are redirected to /login again (session is fully cleared).
result: pass

### 10. View Profile
expected: While logged in, navigate to http://localhost:5174/profile. You see your full name, email (read-only), and an initials avatar. The display name field and timezone dropdown are pre-populated with your current values.
result: pass

### 11. Update Profile — display name
expected: On the profile page, change the display name field and click "Save changes". A toast notification "Display name updated." appears. The sidebar immediately reflects the new name. If you reload, the new name persists.
result: pass

### 12. Update Profile — timezone
expected: On the profile page, change the timezone dropdown to a different timezone and click "Save changes". The save succeeds (toast appears). Reload the profile page — the new timezone is still selected.
result: pass

### 13. Token Refresh Interceptor — silent retry
expected: Log in. Open DevTools Network tab. Wait for the access token to expire (default 15 minutes), OR manually clear the accessToken from Zustand store via DevTools. Make any authenticated request (navigate to /profile). The app should silently refresh the token and load the page — you do NOT see the login page.
result: skipped
reason: requires waiting 15 min for token expiry or DevTools manipulation — covered indirectly by test 7 (session hydration)

## Summary

total: 13
passed: 11
issues: 1
pending: 0
skipped: 1

## Gaps

- truth: "Frontend dev server starts with no warnings or errors"
  status: failed
  reason: "User reported: Vite 8/Rolldown emits 'Invalid input options: jsx' warning on startup"
  severity: minor
  test: 1
  artifacts: [apps/frontend/tsconfig.app.json, apps/frontend/vite.config.ts]
  missing: []

- truth: "Invalid login shows error alert and stays on /login — no redirect"
  status: failed
  reason: "User reported: red alert shows briefly then page refreshes. Root cause: axios 401 interceptor fires on /auth/login response, refresh fails, redirects to /login. Fix applied: excluded /auth/login and /auth/signup from interceptor retry logic."
  severity: major
  test: 6
  artifacts: [apps/frontend/src/lib/axios.ts]
  missing: [AUTH_ENDPOINTS exclusion list in interceptor]
