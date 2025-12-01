# Revision History
| Datum | Version | Beschreibung | Autor |
| --- | --- | --- | --- |
| 2025-12-01 | 0.0 | Neu erstellt | Team BetCeption |
| 2025-12-01 | 0.1 | Status Woche 6–8 dokumentiert | Team BetCeption |
| 2025-12-02 | 0.2 | Blogeinträge Woche 5, Verhaltensmodellierung, Sprint 1 ergänzt | Team BetCeption |

# Architektur-Blog
Kurzprotokoll der Architektur-/Projekt-Themen pro Woche.

## Woche 8 – ASR-Konsolidierung & Realitätscheck
- Kerntreiber: deterministische Spielengine, transaktionssicheres Wallet, gehärtete Auth-Flows, Feature-Toggles für Docs/Metrics.
- Backend: Round/Fairness, Wallet/Ledger, Auth (Refresh-Cookie + Rate-Limits), Leaderboard-Views, Daily-Reward-Transaktion umgesetzt; XP/Level und Power-Up-Effekte fehlen noch.
- Frontend: Blackjack-View (Hit/Stand/Settle), Leaderboard-Tabs, Auth-Panel; kein UI für Shop/Inventar/Wallet/Rewards.
- Offene Punkte: Double/Split, Power-Up-Effekte, XP/Level-Progression, Winnings-Leaderboard ohne Username, UI-Hooks für Daily Reward/Shop.

## Woche 7 – Auth & Leaderboard Härtung
- Auth: `/auth/register|login|refresh|logout` mit HttpOnly Refresh-Cookie, gehashter Session (UA/IP/Expiry), Rotation beim Refresh, Rate-Limits.
- Frontend: HttpClient-Wrapper mit `withCredentials`, Auth-Interceptor hängt Access-Token an; AuthPanel steuert Login/Registrierung.
- Leaderboard: `GET /leaderboard/balance|level|winnings` auf DB-Views, anonym lesbar; optionaler Token liefert `currentUserRank`; Frontend zeigt drei Tabs (Limit 10).

## Woche 6 – Grundpfeiler DB/ORM & UI-Shell
- Backend: TypeORM-Entities für Round/Wallet/Auth/Powerups, Docker Compose für MySQL+Adminer, erste Migrationsbasis.
- Frontend: Routing, erste Leaderboard-Komponente, Blackjack-Shell (Layout), Auth-Basis (Facade, Token-Storage).
- Risiken: fehlende Idempotency-Keys, offene XP-/Power-Up-Story, Client-Integration für Wallet/Shop.

## Woche 5 – Klassendiagramme & Architekturüberarbeitung
- Fokus: konsistentes Backend-Domainmodell (User, Wallet, Round/GameSession, Bets/Sidebets, Powerups) nach SRP, damit Änderungen nur die verantwortliche Klasse betreffen.
- Backend: neues Klassendiagramm aufgebaut, Sequenzdiagramme für UC1/2/6/7/9 angepasst; erste Endpoints und JWT-Konzept entworfen; DB-Modellierung diskutiert (Wallet–Round–User-Relationen).
- Frontend: Homepage/UI weiterentwickelt (Layout, zentrale Komponenten).
- Link: aktuelles Klassendiagramm unter `docs/assets/Klassendiagramme/Backend.md`.

## Verhaltensmodellierung (Use-Case-Verhalten)
- Ziel: dynamisches Verhalten über alle UC1–UC10 (Frontend ↔ Backend ↔ DB) klar dokumentieren.
- Artefakte: Sequenzdiagramme je UC (Login, Spielstart, Einsatz, Power-Up, Leaderboard, Daily Reward, etc.) und zugehörige Aktivitätsdiagramme in den UC-Dokumenten.
- Nutzen: Nachrichtenflüsse und Kontrollpfade nachvollziehbar für Implementierung und Tests.

## Sprint 1 Update (Setup & Vision)
- Team: Justin (Backend/DB/Frontend), Jonah (Frontend), Philipp (Frontend/UI); Scrum Master: Justin, Product Owner: Philipp.
- Vision: Blackjack im Browser mit Sidebets, virtuellem Guthaben (kein Echtgeld), Power-Ups, Daily Bonus; spätere XP/Level.
- Tech-Stack: Angular, Node/Express, MySQL (Docker), JWT-Auth, YouTrack (Scrum), GitHub, Docker Compose, GitHub Actions.
- Scrum: 2-wöchige Sprints, Review/Retro/Planning freitags, Dailys Mo/Mi/So 21:00; Board To Do → In Progress → Code Review → Testing → Done.
- Sprintziel 1: Basis-Setup (Frontend/Backend/DB), Auth (Login/Registration), erste Blackjack-Mechanik. Geplante Stories: US01 (Auth) und US02 (Blackjack).
