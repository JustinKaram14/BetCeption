# RMMM Table — BetCeption

**Projekt:** BetCeption – Blackjack Casino  
**Version:** 1.0  
**Datum:** 2026-04-12  
**Letztes Update:** 2026-04-12

---

## RMMM Table (Risk Mitigation, Monitoring and Management)

| Risk ID | Category | Risk Description | Probability | Impact | Risk Score | Mitigation Strategy | Indicator | Contingency Plan | Responsible | Status | Last Modified |
|---------|----------|------------------|-------------|--------|------------|---------------------|----------|------------------|-------------|--------|--------------|
| R-001 | Technical | **Race Condition bei Wallet-Transaktionen**: Zwei gleichzeitige Wetten desselben Spielers können das Wallet überziehen, da die Sperren nicht schnell genug greifen | 3 | 5 | 15 | Idempotency-Keys für alle Wetten; atomare DB-Operationen; Sperren auf User-ID vor Transaktion | Monitor: Doppelte Buchungen in Logs; Wallet-Saldo < 0 | Sofortige Wallet-Sperre; Admin-Review; Transaktion rollback | Philipp | OPEN | 2026-04-12 |
| R-002 | Technical | **Seed-Kollision in Blackjack-Engine**: Gleicher Seed erzeugt identische Kartenfolge → vorhersagbare Runden, Fairness-Kompromittierung | 2 | 5 | 10 | Seed = UUIDv4 + Timestamp + Round-ID; kein Cache von Seeds; serverseitige Generierung | Monitor: Hash-Vergleich Pre/Post-Round; identische Sequenzen | Round für ungültig erklären; neuer Seed; Hash-Kette prüfen | Justin | OPEN | 2026-04-12 |
| R-003 | Technical | **JWT Refresh Token nicht invalidiert nach Logout**: Angreifer mit stolen Refresh Token könnte Session reaktivieren | 2 | 4 | 8 | Refresh Token in HttpOnly Cookie; SameSite=Strict; kurze TTL (7 Tage); Token-Familien mit Rotation | Monitor: Ungewöhnliche Login-Zeiten; IP-Wechsel; Token-Alter | Alle Token der Familie invalidieren; Passwort-Reset erzwingen | Philipp | OPEN | 2026-04-12 |
| R-004 | Technical | **Docker Compose Networking**: Backend kann MySQL-Container nicht erreichen → keine Persistenz | 2 | 5 | 10 | Healthchecks in docker-compose; restart: always; explizite Netzwerk-Definition | Monitor: Healthcheck-Failures; Connection-Timeouts in Logs | Neustart der Container; Netzwerk neu erstellen; Backup-Restore | Justin | OPEN | 2026-04-12 |
| R-005 | Technical | **TypeORM Deadlocks unter hoher Last**: Viele gleichzeitige Runden → Transaktionen warten auf Lock | 2 | 3 | 6 | Optimistic Locking via Version-Column; Read-Commited Isolation; Connection Pooling (10 max) | Monitor: Query-Dauer > 500ms; Deadlock-Warnungen in Logs | Connection-Pool reset; Warteschlange für Anfragen | Justin | OPEN | 2026-04-12 |
| R-006 | Schedule | **Team-Koordination Backend/Frontend**: API-Änderungen ohne Abstimmung → Integrationsfehler | 3 | 3 | 9 | Wöchentliche Sync-Meetings; Swagger/OpenAPI Spec vor Implementation; Postman-Tests | Monitor: Merge-Konflikte; API-Breaking Changes; Failed Builds | API-Versioning; Feature-Flags; gemeinsames Review vor Merge | Team | OPEN | 2026-04-12 |
| R-007 | Technical | **XSS in Chat/Username**: Spieler können JavaScript in Usernamen injizieren | 2 | 4 | 8 | Input-Validierung via Zod; Angular DomSanitizer; Content-Security-Policy Header | Monitor: Ungewöhnliche Script-Tags in DB; Browser-Warnungen | Content-Escape; Account-Sperre; CSP-Report auswerten | Philipp | OPEN | 2026-04-12 |
| R-008 | Financial | **Fake Accounts für Daily Rewards**: Spieler erstellen viele Accounts für Bonus-Sammmlung | 2 | 3 | 6 | IP-basiertes Rate-Limiting; Device-Fingerprinting; Email-Verifikation | Monitor: Ungewöhnliche Account-Erstellung; viele Rewards pro IP | Rewards zurückziehen; IP sperren; Captcha bei Registration | Team | OPEN | 2026-04-12 |
| R-009 | Technical | **Passwort-Hashes via bcrypt zu schwach**: Kurze Passwörter trotz Hashing leicht zu cracken | 1 | 4 | 4 | bcrypt cost factor = 12; Passwort-Mindestlänge 8 Zeichen; regex complexity Check | Monitor: Cracked Hashes in Leaked-DB-Checks | Sofortiger Password-Reset;强制复杂度要求 | Justin | OPEN | 2026-04-12 |
| R-010 | Operational | **Datenverlust bei Container-Stopp**: Uncommitted Transactions gehen verloren | 1 | 5 | 5 | Docker Volumes für MySQL data; regelmäßige Snapshots; Write-Ahead Log aktiviert | Monitor: Volume-Mount-Errors; unerwartete Container-Stops | Backup-Restore aus letztem Snapshot; Replay der in-flight Transaktionen | Justin | OPEN | 2026-04-12 |

---

## Risiko-Score Skala

- **Probability:** 1 = Unlikely, 2 = Possible, 3 = Likely, 4 = Almost Certain
- **Impact:** 1 = Negligible, 2 = Minor, 3 = Moderate, 4 = Major, 5 = Catastrophic
- **Risk Score = Probability × Impact** (Scale 1-20)

---

## Top Ten Software Project Risks Checklist (verwendete Punkte)

1. ✅ **Personnel shortfall** — Team mit 3 Personen, klare Rollenverteilung
2. ✅ **Unrealistic estimates** — Aufwandsschätzung aus Handout: 108h gesamt
3. ✅ **Silver bullet syndrome** — Bewusst gewählte etablierte Technologien (Angular, Node.js, MySQL)
4. ✅ **Requirements gold-plating** — Scope klar definiert: Blackjack + Wallet + PowerUps
5. ✅ **Unit tests vs system test** — Jest + Supertest vorhanden
6. ✅ **Integration risk** — Feature-Folder Struktur; API first
7. ✅ **Front-end risk** — Angular mit Interceptors/Guards; Philipp als Frontend-Lead
8. ✅ **Database risk** — ACID-Transaktionen; Ledger-Ansatz für Buchungen
9. ✅ **Deployment risk** — Docker Compose; Cloud86 Deployment dokumentiert
10. ✅ **Technology risk** — Bewusst gewählter Stack (TypeORM, Zod, bcrypt)

---

## größtes technisches Risiko: R-001 (Race Condition bei Wallet-Transaktionen)

### Risiko erklärt

Das größte technische Risiko ist eine **Race Condition** im Wallet-System. Wenn ein Spieler zwei Wetten in kurzer Zeit hintereinander platziert (z.B. Sidebet + Haupteinsatz), könnten beide Transaktionen gleichzeitig die Wallet-Balance prüfen — beide sehen denselben Saldo, beide buchen ab, das Wallet geht ins Negative.

### Mitigation Strategy

1. **Idempotency-Keys**: Jede Wette erhält einen eindeutigen Key (UUID). Doppelte Requests mit gleichem Key werden erkannt und abgelehnt.
2. **Atomare DB-Operationen**: Statt Read→Modify→Write nutzen wir `UPDATE wallet SET balance = balance - ? WHERE user_id = ? AND balance >= ?`
3. **Row-Level Locking**: `SELECT ... FOR UPDATE` sperrt die Wallet-Zeile für die Dauer der Transaktion

### Contingency Plan

- **Monitoring**: Echtzeit-Alert wenn Wallet-Saldo < 0
- **Sofortmaßnahme**: Account temporär sperren
- **Rollback**: Alle Buchungen der Runde zurücknehmen
- **Post-Incident**: Transaktionslogs auswerten; Idempotency-Key-Lücke finden

---

## Version History

| Version | Datum | Autor | Änderung |
|---------|-------|-------|----------|
| 1.0 | 2026-04-12 | Philipp | Initiale RMMM Tabelle erstellt |
