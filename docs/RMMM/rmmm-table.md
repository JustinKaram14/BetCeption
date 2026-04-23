# RMMM Table — BetCeption

**Projekt:** BetCeption – Blackjack Casino  
**Version:** 2.0  
**Datum:** 2026-04-23  
**Tool:** Markdown-Tabelle mit Git-Versionierung – direkt im Repository versionierbar und über Pull Requests im Team reviewbar.

---
## RMMM Table (Risk Mitigation, Monitoring and Management)

| Risk ID | Category | Risk Description | Probability | Impact | Risk Score | Mitigation Strategy | Indicator | Contingency Plan | Responsible | Status | Last Modified |
|---------|----------|------------------|-------------|--------|------------|---------------------|----------|------------------|-------------|--------|--------------|
| R-001 | Technical | **Race Condition bei Wallet-Transaktionen**: Zwei gleichzeitige Wetten desselben Spielers können das Wallet überziehen, da die Sperren nicht schnell genug greifen | 3 | 5 | 15 | Idempotency-Keys für alle Wetten; atomare DB-Operationen; Sperren auf User-ID vor Transaktion | Monitor: Doppelte Buchungen in Logs; Wallet-Saldo < 0 | Sofortige Wallet-Sperre; Admin-Review; Transaktion rollback | Philipp | OPEN | 2026-04-12 |
| R-002 | Technical | **Seed-Kollision in Blackjack-Engine**: Gleicher Seed erzeugt identische Kartenfolge → vorhersagbare Runden, Fairness-Kompromittierung | 1 | 5 | 5 | Seed = `crypto.randomBytes(32)` (256 Bit Entropie); kein Cache von Seeds; serverseitige Generierung; SHA-256-Hash wird vor der Runde veröffentlicht | Monitor: Hash-Vergleich Pre/Post-Round; identische Sequenzen | Round für ungültig erklären; neuer Seed generieren; Hash-Kette prüfen | Justin | OPEN | 2026-04-21 |
| R-003 | Technical | **JWT Refresh Token nicht invalidiert nach Logout**: Angreifer mit gestohlenem Refresh Token könnte Session reaktivieren | 2 | 4 | 8 | Refresh Token als HttpOnly Cookie (nicht per JS auslesbar); Session wird bei Logout aus DB gelöscht; Token-Rotation bei jedem Refresh; kurze TTL (7 Tage) | Monitor: Ungewöhnliche Login-Zeiten; IP-Wechsel; Token-Alter | Session-Eintrag löschen; Passwort-Reset erzwingen | Philipp | MITIGATED | 2026-04-21 |
| R-004 | Operational | **Railway-Ausfall / Datenbank nicht erreichbar**: Backend kann MySQL-Instanz auf Railway nicht erreichen → API nicht verfügbar | 2 | 5 | 10 | Managed MySQL auf Railway mit automatischen Backups; Verbindungspool mit Retry-Logik; TypeORM reconnect on failure | Monitor: Connection-Timeouts in Logs; Health-Endpoint nicht erreichbar | Neustart des Railway-Deployments; Restore aus Railway-Backup; Nutzer informieren | Justin | OPEN | 2026-04-21 |
| R-005 | Technical | **TypeORM Deadlocks unter hoher Last**: Viele gleichzeitige Runden → Transaktionen warten auf Lock | 2 | 3 | 6 | Pessimistic Write Locking (`SELECT ... FOR UPDATE`) auf allen kritischen Entitäten; Read-Committed Isolation; Connection Pooling | Monitor: Query-Dauer > 500ms; Deadlock-Warnungen in Logs | Connection-Pool reset; Warteschlange für Anfragen | Justin | OPEN | 2026-04-21 |
| R-006 | Schedule | **Team-Koordination Backend/Frontend**: API-Änderungen ohne Abstimmung → Integrationsfehler | 3 | 3 | 9 | Wöchentliche Sync-Meetings; Swagger/OpenAPI Spec vor Implementation; Postman-Tests | Monitor: Merge-Konflikte; API-Breaking Changes; Failed Builds | API-Versioning; Feature-Flags; gemeinsames Review vor Merge | Team | OPEN | 2026-04-12 |
| R-007 | Technical | **XSS in Username/Anzeigefeldern**: Spieler können JavaScript in Benutzernamen oder andere Anzeigefelder injizieren | 2 | 4 | 8 | Input-Validierung via Zod (Schema-Constraints); Angular DomSanitizer verhindert DOM-Injection; Content-Security-Policy Header | Monitor: Ungewöhnliche Zeichen in DB-Einträgen; Browser-Sicherheitswarnungen | Betroffene Inhalte escapen; Account sperren; CSP-Report auswerten | Philipp | OPEN | 2026-04-21 |
| R-008 | Financial | **Fake Accounts für Daily Rewards**: Spieler erstellen viele Accounts für Bonus-Sammmlung | 2 | 3 | 6 | IP-basiertes Rate-Limiting; Device-Fingerprinting; Email-Verifikation | Monitor: Ungewöhnliche Account-Erstellung; viele Rewards pro IP | Rewards zurückziehen; IP sperren; Captcha bei Registration | Team | OPEN | 2026-04-12 |
| R-009 | Technical | **Passwort-Hashes via bcrypt zu schwach**: Kurze Passwörter trotz Hashing leicht zu cracken | 1 | 4 | 4 | bcrypt cost factor = 12; Passwort-Mindestlänge 8 Zeichen; regex complexity Check | Monitor: Cracked Hashes in Leaked-DB-Checks | Sofortiger Password-Reset; Komplexitätsanforderungen erzwingen | Justin | OPEN | 2026-04-12 |
| R-010 | Operational | **Datenverlust bei Container-Stopp**: Uncommitted Transactions gehen verloren | 1 | 5 | 5 | Docker Volumes für MySQL data; regelmäßige Snapshots; Write-Ahead Log aktiviert | Monitor: Volume-Mount-Errors; unerwartete Container-Stops | Backup-Restore aus letztem Snapshot; Replay der in-flight Transaktionen | Justin | OPEN | 2026-04-12 |

---

## Risiko-Score Skala

- **Probability:** 1 = Unlikely, 2 = Possible, 3 = Likely, 4 = Almost Certain
- **Impact:** 1 = Negligible, 2 = Minor, 3 = Moderate, 4 = Major, 5 = Catastrophic
- **Risk Score = Probability × Impact** (Scale 1-20)

---

## Top Ten Software Project Risks Checklist (verwendete Punkte)

1. ✅ **Personnel shortfall** - Team mit 3 Personen, klare Rollenverteilung
2. ✅ **Unrealistic estimates** - Aufwandsschätzung aus Handout: 108h gesamt
3. ✅ **Silver bullet syndrome** - Bewusst gewählte etablierte Technologien (Angular, Node.js, MySQL)
4. ✅ **Requirements gold-plating** - Scope klar definiert: Blackjack + Wallet + PowerUps
5. ✅ **Unit tests vs system test** - Jest + Supertest vorhanden
6. ✅ **Integration risk** - Feature-Folder Struktur; API first
7. ✅ **Front-end risk** - Angular mit Interceptors/Guards; Philipp als Frontend-Lead
8. ✅ **Database risk** - ACID-Transaktionen; Ledger-Ansatz für Buchungen
9. ✅ **Deployment risk** - Docker Compose; Cloud86 Deployment dokumentiert
10. ✅ **Technology risk** - Bewusst gewählter Stack (TypeORM, Zod, bcrypt)

---

## größtes technisches Risiko: R-001 (Race Condition bei Wallet-Transaktionen)

### Risiko erklärt

Das größte technische Risiko ist eine **Race Condition** im Wallet-System. Wenn ein Spieler zwei Wetten in kurzer Zeit hintereinander platziert (z.B. Sidebet + Haupteinsatz), könnten beide Transaktionen gleichzeitig die Wallet-Balance prüfen - beide sehen denselben Saldo, beide buchen ab, das Wallet geht ins Negative.

### Mitigation Strategy

1. **Pessimistic Write Locking**: Jede Wallet-Operation holt den User-Datensatz mit `SELECT ... FOR UPDATE` (`lock: { mode: 'pessimistic_write' }`). Die Zeile ist bis zum Commit gesperrt – parallele Transaktionen müssen warten.
2. **ACID-Transaktionen**: Alle Buchungen laufen in einer TypeORM-Transaktion. Schlägt ein Schritt fehl, wird die gesamte Transaktion zurückgerollt.
3. **Saldo-Prüfung innerhalb der gesperrten Transaktion**: Erst nachdem die Sperre greift, wird der aktuelle Saldo geprüft und der Betrag abgezogen.

### Contingency Plan

- **Monitoring**: Echtzeit-Alert wenn Wallet-Saldo < 0
- **Sofortmaßnahme**: Account temporär sperren
- **Rollback**: Alle Buchungen der Runde zurücknehmen
- **Post-Incident**: Transaktionslogs auswerten; Idempotency-Key-Lücke finden

---

## Version History

| Version | Datum | Änderung |
|---------|-------|----------|
| 1.0 | 2026-04-12 | Initiale RMMM Tabelle erstellt |
| 1.1 | 2026-04-21 | R-002 Mitigation korrigiert (randomBytes statt UUIDv4+Timestamp); R-003 auf MITIGATED gesetzt; R-004 von Docker Compose auf Railway umgestellt; R-005 Locking-Strategie korrigiert (pessimistic statt optimistic); R-007 Chat-Referenz entfernt |
