# Phase 2: Authentication - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 02-authentication
**Areas discussed:** Token & Session Strategy, Registration & Default Role, Frontend Auth Pages & Shell

---

## Token & Session Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| In-memory only (Zustand) | XSS-proof — never touches localStorage or sessionStorage | ✓ |
| sessionStorage | Cleared on tab close | |
| localStorage | Persistent but XSS-vulnerable | |

**User's choice:** In-memory only (Zustand) — Claude's discretion / industry best practice

---

| Option | Description | Selected |
|--------|-------------|----------|
| httpOnly cookie, 7-day sliding | Resets lifetime on each refresh | |
| httpOnly cookie, 30-day fixed | Fixed expiry from login time | ✓ |
| localStorage, 7-day | XSS-vulnerable | |

**User's choice:** httpOnly cookie, 30-day fixed

---

| Option | Description | Selected |
|--------|-------------|----------|
| 15 minutes | Tight window, frequent refresh | ✓ |
| 1 hour | Less refresh overhead | |
| 24 hours | Rarely refreshes but long exposure window | |

**User's choice:** 15 minutes access token TTL

---

| Option | Description | Selected |
|--------|-------------|----------|
| Server clears cookie + Redis blacklist | Full invalidation — stolen tokens also revoked | ✓ |
| Server clears cookie only | Cookie gone but token valid until expiry if leaked | |
| Client clears Zustand only | Server-side token remains valid | |

**User's choice:** Server clears cookie + Redis blacklist

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — single-use rotation | Each refresh issues a new token, old one invalidated | ✓ |
| No — reuse the same token | Simpler but replay-vulnerable | |

**User's choice:** Yes — single-use rotation

---

## Registration & Default Role

| Option | Description | Selected |
|--------|-------------|----------|
| Open | Anyone with email can sign up | ✓ |
| Admin-provisioned only | No public signup, admin creates accounts | |
| Open with email domain restriction | Only configured domains allowed | |

**User's choice:** Open self-registration

---

| Option | Description | Selected |
|--------|-------------|----------|
| No verification | Immediate access — simpler, email flows are v2 | ✓ |
| Verification required | Email link required before login — needs SMTP infra | |

**User's choice:** No email verification in Phase 2

---

| Option | Description | Selected |
|--------|-------------|----------|
| Email + password only | Minimal friction | |
| Email + password + display name | Collects name upfront | ✓ |

**User's choice:** Email + password + display name (all three required at signup)

---

**Password policy question** — User provided custom rules:
> "8+ chars, 1 uppercase, 1 number, no sequential runs of 3+ digits (e.g. 1234), no repeating digits 3+ times (e.g. 1111), 1 symbol"

**User's choice:** Custom policy — 8+ chars, 1 uppercase, 1 number, 1 symbol, no 3+ sequential digits, no 3+ repeating same character

---

## Frontend Auth Pages & Shell

| Option | Description | Selected |
|--------|-------------|----------|
| Full skeleton with real routes | All nav items with correct paths from day 1 | |
| Minimal — just auth shell | Sidebar has logo + user info + logout only; nav added per phase | ✓ |

**User's choice:** Minimal sidebar in Phase 2 — nav items added as each phase ships

---

| Option | Description | Selected |
|--------|-------------|----------|
| Centered card on plain background | Standard SaaS/LMS pattern | ✓ |
| Split-panel (form + branding) | More polished, higher effort | |
| Full-width minimal | No card chrome | |

**User's choice:** Centered card + logo above (if available) + real-time password checklist + auto-focus on first input with visible focus ring

---

| Option | Description | Selected |
|--------|-------------|----------|
| Name + password change | Common profile scope | |
| Name only | Password change deferred | |
| Name + timezone | User chose this | ✓ |

**User's choice:** Display name + timezone. Password change deferred to later phase.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Inline under form fields | Field-level + banner for server errors | ✓ |
| Toast notifications only | All errors in corner toasts | |

**User's choice:** Inline validation errors + server error banner above form

---

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to /login?next={path} | Sends user back after login | ✓ |
| Redirect to /login (no next) | Always goes to /dashboard after login | |

**User's choice:** /login?next={encodedPath} with fallback to /dashboard

---

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen spinner | Simple, no flash | ✓ |
| Skeleton layout | Polished but more work | |
| Nothing (instant) | Risks flash of wrong content | |

**User's choice:** Full-screen spinner during auth initialization

---

| Option | Description | Selected |
|--------|-------------|----------|
| Lucide React | Lightweight, TS-first, line-art | ✓ |
| Heroicons | Tailwind's icon set | |

**User's choice:** Lucide React

---

**Color schema** — User provided a comprehensive design system:
- Primary: Indigo `#4F46E5`
- Secondary: Cyan `#06B6D4`
- Semantic: Success `#10B981`, Warning `#F59E0B`, Error `#EF4444`, Info `#3B82F6`
- Sidebar: Dark `#111827`
- Full LMS status color mapping and role-based accent colors

Full details captured in CONTEXT.md D-25.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Deferred | Build light palette only in Phase 2 | ✓ |
| System preference | Auto prefers-color-scheme | |
| Manual toggle | User-controlled with Tailwind dark: variants | |

**User's choice:** Dark mode deferred

---

## Claude's Discretion

- Exact sidebar padding, logo treatment, spacing details
- Form validation error message copy
- Loading spinner animation style
- Initials avatar color derivation (use role-hinted palette, deterministic from user ID hash)
- Layout implementation (React Router Outlet vs explicit wrappers)
- Timezone picker component choice

## Deferred Ideas

- Avatar file upload → Phase 4
- Password change UI → later phase
- Email change flow → requires email verification infra
- OAuth/SSO → v2 requirements
- Two-factor authentication → v2 requirements
- Dark mode → deferred, light palette only in Phase 2
- Email verification on signup → v2 scope
