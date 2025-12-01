# Revision History
| Datum | Version | Beschreibung | Autor |
| --- | --- | --- | --- |
| 2025-12-01 | 0.0 | Neu erstellt (noch nicht im Git-Verlauf) | Team BetCeption |
| 2025-12-01 | 0.1 | Abgleich mit aktuellem Code/Status | Team BetCeption |

# Architektur-Blog (Woche 6-8)

Kurzer Projektblog zu den Architekturthemen der letzten Wochen. Fokus: Abgleich mit dem tatsaechlich gelieferten Code.

## Woche 8 - ASR-Konsolidierung & Realitaetscheck
- Kerntreiber: deterministische Spielengine, transaktionssicheres Wallet, gehärtete Auth-Flows, Feature-Toggles fuer Docs/Metrics.
- Backend: Round/Fairness, Wallet/Ledger, Auth mit Refresh-Cookies + Rate-Limits, Leaderboard-Views, Daily-Reward-Transaktion sind umgesetzt. XP/Level wird noch nicht erhoeht; Power-Up-Effekte greifen nicht.
- Frontend: Blackjack-View (Hit/Stand/Settle), Leaderboard-Tabs und Auth-Panel existieren. Kein UI fuer Shop/Inventar/Wallet/Rewards; Login-/Register-Seiten sind Platzhalter.
- Offene Baustellen: Double/Split im Spiel-Flow, Power-Up-Effekte, XP/Level-Progression, Winnings-Leaderboard ohne Username, UI-Hooks fuer Daily Reward/Shop.

## Woche 7 - Auth & Leaderboard Härtung
- Auth-Flow: `/auth/register|login|refresh|logout` mit HttpOnly Refresh-Cookie, gehashter Session (`sessions` mit UA/IP/Expiry), Rotation beim Refresh, Rate-Limits pro Route.
- Frontend-Kommunikation: HttpClient-Wrapper mit `withCredentials`; Auth-Interceptor haengt Access-Token an, wenn vorhanden; AuthPanel steuert Login/Registrierung.
- Leaderboard: `GET /leaderboard/balance|level|winnings` auf DB-Views, anonym lesbar; optionaler Token liefert `currentUserRank`. Frontend zeigt drei Tabs (Limit 10).

## Woche 6 - Grundpfeiler DB/ORM & UI-Shell
- Backend: TypeORM-Entities fuer Round/Wallet/Auth/Powerups, Docker Compose fuer MySQL + Adminer, erste Migrationsbasis.
- Frontend: Routing, erste Leaderboard-Komponente, Blackjack-Shell (Layout), Auth-Basis (Facade, Token-Storage).
- Risiken identifiziert: fehlende Idempotency-Keys, offene XP-/Power-Up-Story, Client-Integration fuer Wallet/Shop.
