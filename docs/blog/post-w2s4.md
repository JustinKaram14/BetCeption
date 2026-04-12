# Architektur-Blog Woche 14

## Was wir diese Woche gemacht haben

### RMMM Analyse (Risk Mitigation, Monitoring and Management)

Vollständige RMMM-Tabelle erstellt und versioniert unter `docs/RMMM/rmmm-table.md`. Folgende Risiken wurden identifiziert und dokumentiert:

| Kategorie | Anzahl | Höchstes Score |
|-----------|--------|----------------|
| Technical | 7 | 15 |
| Schedule | 1 | 9 |
| Financial | 1 | 6 |
| Operational | 1 | 5 |

Die Tabelle enthält für jedes Risiko: Risk ID, Category, Risk Description, Probability, Impact, Risk Score, Mitigation Strategy, Indicator, Contingency Plan, Responsible und Status.

Verwendete Referenz: Top Ten Lists of Software Project Risks Checklist

### Projektfortschritt seit der Halbzeitpräsentation

**Backend:**
- Blackjack-Engine mit deterministischer Kartenverteilung via Seed + Hash (beweisbare Fairness)
- Wallet-System mit ACID-Transaktionen und Ledger-Ansatz
- JWT-Authentifizierung mit HttpOnly Refresh-Cookies und Rate-Limiting
- Docker Compose Setup für MySQL + Backend

**Frontend:**
- Blackjack-Spielfeld mit versteckter Dealer-Karte
- Auth-Integration mit Angular Guards und Interceptors
- Routing-Struktur und RxJS-basiertes State-Management

**DevOps:**
- Cloud86 Deployment dokumentiert
- CI/CD Pipeline via GitHub Actions

## Größtes technisches Risiko: Race Condition im Wallet-System

### Risiko (R-001)

Race Condition bei gleichzeitigen Wallet-Transaktionen. Zwei Wetten in kurzer Zeit könnten beide dieselbe Balance prüfen und das Wallet ins Negative buchen.

### Mitigation Strategy

1. **Idempotency-Keys**: Jede Wette erhält eindeutigen Key; doppelte Requests werden erkannt
2. **Atomare SQL-Operationen**: `UPDATE wallet SET balance = balance - ? WHERE balance >= ?`
3. **Row-Level Locking**: `SELECT ... FOR UPDATE` sperrt die Wallet-Zeile während der Transaktion

### Contingency Plan

- Echtzeit-Monitoring auf negative Wallet-Salden → Alert
- Account sofort sperren bei negativem Saldo
- Transaktions-Rollback aller offenen Wetten
- Post-Incident-Analyse der Transaktionslogs

## Nächste Schritte

- Power-Up System fertigstellen (Frontend + Backend Integration)
- Leaderboard mit Echtzeit-Updates
- XP/Level-Progression finalisieren
- Testing und Balancing

## Links

- RMMM Tabelle: `docs/RMMM/rmmm-table.md`
- Use Cases: `docs/use-cases/`
- UCRS: `docs/use-case-realisation/`
- SAD: `docs/architecture/SAD.md`
