# Phase 2: Authentication - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 02-authentication
**Areas discussed:** Frontend Auth UX (token strategy applied as industry best practice)

---

## Area Selection

| Option | Selected |
|--------|----------|
| Token & session strategy | ✗ (delegated to Claude — industry best practice) |
| Registration flow | ✗ (delegated to Claude — reasonable defaults) |
| Profile page scope | Partially (covered in UX questions) |
| Frontend auth UX | ✓ |

**User intent:** "Focus on UX for this one, the flow and session strategy you can use which one is the best for industry practice"

---

## Frontend Auth UX

### Auth Page Presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated full pages | /login and /signup routes — standard for LMS, deep-linkable | ✓ |
| Modal overlay | Pops up over current page — more app-like, adds complexity | |
| Split-panel layout | Left: branding, Right: form — modern SaaS style | |

**User's choice:** Dedicated full pages  
**Notes:** Standard LMS pattern chosen for simplicity and deep-linkability.

---

### Post-Login Redirect

| Option | Description | Selected |
|--------|-------------|----------|
| Always /dashboard | Simple and predictable | |
| Intended destination | Redirect to where user was trying to go (?next= param) | ✓ |

**User's choice:** Intended destination  
**Notes:** Requires storing the `next` URL param; falls back to /dashboard when absent.

---

### Protected Route Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to /login with ?next= | Standard pattern, works with intended-destination choice | ✓ |
| Show 403 / Unauthorized page | Error page with login button | |

**User's choice:** Redirect to /login with ?next=

---

### App Shell for Authenticated Users

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal header (avatar + logout) | Top bar only, enough for UAT | |
| Full sidebar nav skeleton | Build nav shell now with placeholder links | ✓ |
| No shell — just pages | Skip nav entirely for Phase 2 | |

**User's choice:** Full sidebar nav skeleton  
**Notes:** Sets up routing structure that later phases fill in. More work in Phase 2 but pays forward.

---

### Profile Page — Editable Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Name + password change | Standard; email stays locked | ✓ |
| Name only | Password change deferred | |
| Name + email + password | Full edit incl. email change | |

**User's choice:** Name + password change (recommended)

---

### Avatar Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Initials placeholder | Colored circle from name initials, zero dependency | ✓ |
| URL input field | Paste image URL — fragile | |
| Skip avatars entirely | No avatar UI in Phase 2 | |

**User's choice:** Initials placeholder (recommended)

---

## Claude's Discretion

- Token & session strategy (user explicitly delegated: "use which one is the best for industry practice")
- Registration flow defaults (open self-registration, STUDENT as default role)
- Sidebar nav item labels and icons
- Form validation error copy
- Loading skeleton approach
- Initials avatar color palette and hash algorithm

## Deferred Ideas

- Avatar file upload → Phase 4
- Email change flow → future phase
- OAuth/SSO → not in v1 requirements
- 2FA → not in v1 requirements
