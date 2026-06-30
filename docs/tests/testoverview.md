Hier eine Übersicht aller Tests im Projekt:

---

## 🖥️ Frontend — Angular Karma (Unit/Integration)
**37 Spec-Dateien** — `ng test`

| Bereich | Dateien |
|---|---|
| App root | `app.spec.ts` |
| Core / Layout | `app-shell.spec.ts` |
| Core / i18n | `i18n.spec.ts` |
| Auth core | `auth.spec.ts`, `auth-guard.spec.ts`, `auth-interceptor.spec.ts`, `token-storage.spec.ts` |
| Auth pages | `login.spec.ts`, `register.spec.ts`, `verify-email.spec.ts` |
| Auth service | `auth-facade.spec.ts` |
| Blackjack | `blackjack.spec.ts`, `table.spec.ts`, `hand.spec.ts`, `controls.spec.ts` |
| Homepage | `homepage.spec.ts`, `auth-panel.spec.ts`, `leaderboard.spec.ts`, `how-to-play-modal.spec.ts`, `daily-reward-modal.spec.ts`, `hero.spec.ts`, `neon-card.spec.ts`, `cta-panel.spec.ts` |
| Legal | `impressum.spec.ts`, `datenschutz.spec.ts` |
| Shared UI | `button.spec.ts`, `not-found.spec.ts`, `settings-menu.spec.ts`, `toast.service.spec.ts`, `toast-container.spec.ts`, `disclaimer-footer.spec.ts` |
| Services | `wallet.spec.ts`, `rng.spec.ts` |
| Pipes | `format-coins-pipe.spec.ts` |
| API | `http-client.spec.ts`, `betception-api.service.spec.ts` |
| Risk-Up | `card-guess.spec.ts` |

---

## 🎭 Frontend — Playwright E2E
**5 Spec-Dateien** — `npm run e2e`

| Datei | Tests |
|---|---|
| `auth-forms.e2e.spec.ts` | Login, Registrierung, Logout |
| `routing.e2e.spec.ts` | Root-Redirect, Auth-Guard, Login→Blackjack |
| `modals.e2e.spec.ts` | How-to-play, Daily Reward, Narrow Viewport, Tab-Navigation |
| `blackjack-game.e2e.spec.ts` | Bet→Deal→Stand→Result, Fresh-Page-State |
| `settings.e2e.spec.ts` | Öffnen, Sprache vor/zurück, Escape, Sprachwechsel |

---

## ⚙️ Backend — Jest (Unit)
**27 Test-Dateien** — `npm test` im Backend

| Bereich | Dateien |
|---|---|
| Utils | `jwt.test.ts`, `passwords.test.ts`, `money.test.ts`, `tokenHash.test.ts`, `logger.test.ts`, `fairness.utils.test.ts` |
| Middlewares | `authGuard`, `apiKeyGuard`, `rateLimiters`, `rate-limit-store`, `errorHandler`, `notFoundHandler`, `validateRequest` |
| Controller | `auth`, `wallet`, `user`, `shop`, `round`, `rewards`, `powerups`, `fairness`, `leaderboard`, `inventory` |
| Spezial | `round.fairness.test.ts` (Provably-Fair-Logik), `round.business-logic.test.ts` (evaluateHand/resolveMainBet/evaluateSideBet) |
| Integration | `db-integrity.test.ts` (Docker/MySQL), `app.health.test.ts` |

---

## 📊 Backend — k6 Performance
**4 Szenarien** — `npm run perf`

| Datei | Was wird gemessen |
|---|---|
| `auth-flow.js` | Login + Register (p95 < 600ms) |
| `game-flow.js` | Bet→Deal→Stand Zyklus (p95 < 300ms) |
| `wallet-flow.js` | Wallet-Abfragen |
| `leaderboard.js` | Leaderboard-Abfragen |
