# BetCeption – Semester-Handout

## 1. Projektüberblick
- Blackjack-Spiel im Browser (SPA)
- Sidebets & Power-Ups
- Virtuelles Wallet (Spielgeld, kein Glücksspielrecht)
- Fairness-Commitment mit Seed + Hash (prüfbare Runden)

## 2. Architektur & Hauptentscheidungen
- Architekturstil: Backend & Frontend als Feature-Folder
- Fairness / Engine:
  - Serverseitige, deterministische Blackjack-Engine
  - Pro Runde: starker Seed → Hash → an Client; später Seed zur Prüfung
- Konsistenz / Transaktionen:
  - Wallet & Bets in ACID-Transaktionen
  - Sperren / Idempotenz-Keys gegen Doppelbuchungen
  - Ledger-Ansatz für Buchungsverlauf
- Security-by-default:
  - Auth mit JWT (+ Refresh-Cookie: HttpOnly, SameSite, Secure)
  - Passwörter via bcrypt
  - Rate-Limits auf kritischen Endpoints
- Observability:
  - Request-IDs, strukturierte Logs (UserId, RoundId)
- Deployment:
  - Docker Compose für Datenbank und Backend

## 3. Technologien & Tools
- Backend: Node.js, Express, TypeORM, MySQL 8, bcrypt, zod, Jest, Supertest, Docker Compose
- Frontend: Angular, RxJS, HttpClient/Interceptor/Guards, CSS
- CI/PM: GitHub, GitHub Actions, YouTrack/Board

## 4. Overall Use Case
```mermaid
flowchart LR
  actor(Player)
  actor(Admin)

  subgraph Gameplay
    UC5[UC5: Spiel starten]
    UC6[UC6: Wetten platzieren]
    UC7[UC7: Spielzug ausführen]
    UC8[UC8: Power-Up einsetzen]
  end

  subgraph Account & Wallet
    UC1[UC1: Authentifizierung/Session]
    UC2[UC2: Shop/Inventar/Guthaben]
    UC3[UC3: Daily Reward]
    UC4[UC4: Leaderboard anzeigen]
    UC9[UC9: XP/Level verwalten]
  end

  subgraph System
    UC10[UC10: Daten persistieren]
  end

  Player --> UC1
  Player --> UC5 --> UC6 --> UC7
  Player --> UC8
  Player --> UC2
  Player --> UC3
  Player --> UC4
  Player --> UC9
  Admin --> UC4
  UC5 --> UC10
  UC6 --> UC10
  UC7 --> UC10
  UC8 --> UC10
  UC2 --> UC10
  UC3 --> UC10
  UC9 --> UC10
```

## 5. Aufwandsstatistik
- Gesamt erfasster Aufwand (Team): ca. 108 h (≈ 6.500 Minuten)
- Verteilung nach Personen (gerundet):
  - Justin: ~ 50 h
  - Philipp: ~ 39 h
  - j.haeuser4: ~ 20 h
- Verteilung nach Workflows:
  - Allgemein: ~ 3 h
  - Backend: ~ 32 h
  - Database: ~ 7 h
  - Frontend: ~ 45 h
  - Projektmanagement: ~ 22 h

## 6. Rollen & Hauptbeiträge im Team
- Justin
  - Architektur & technische Leitplanken
  - Hauptverantwortlich Backend
  - Docker-Setup und Infrastruktur
- Philipp
  - Hauptverantwortlich Frontend
  - Auth-Integration, Routing, Guards & Interceptor
- J. Häuser
  - Anforderungsanalyse & Dokumentation
  - Unterstützung beim Testing
  - Unterstützung bei Frontend & Backend
