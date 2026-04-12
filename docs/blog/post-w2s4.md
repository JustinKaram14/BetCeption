# Blog: RMMM Analyse & Projektfortschritt

**Autor:** Philipp  
**Datum:** 12. April 2026  
**Kategorie:** Risikomanagement & Projektupdate

---

## RMMM Table — Risikomanagement für BetCeption

Wie in der Aufgabe gefordert, haben wir eine vollständige **RMMM-Tabelle** (Risk Mitigation, Monitoring and Management) für unser Projekt erstellt. Die Tabelle befindet sich unter `docs/RMMM/rmmm-table.md` und enthält 10 identifizierte Risiken mit vollständiger Dokumentation.

### Risiko-Kategorien im Überblick

| Kategorie | Anzahl Risiken | Höchstes Score |
|-----------|---------------|-----------------|
| Technical | 7 | 15 (Race Condition) |
| Schedule | 1 | 9 (Team-Koordination) |
| Financial | 1 | 6 (Fake Accounts) |
| Operational | 1 | 5 (Datenverlust) |

### Top 3 Risiken nach Score

1. **R-001: Race Condition bei Wallet-Transaktionen** (Score: 15)
2. **R-002: Seed-Kollision in Blackjack-Engine** (Score: 10)
3. **R-004: Docker Compose Networking** (Score: 10)

---

## Unser größtes technisches Risiko: Race Condition im Wallet

Wir haben uns intensiv mit unseren technischen Risiken auseinandergesetzt. Das größte Risiko sehen wir in **Race Conditions beim Wallet-System**.

### Das Problem

Bei gleichzeitigen Wetten (z.B. Hauptwette + Sidebet) könnte folgendes passieren:

```
Spieler hat 100€ Wallet
Runde 1: Hauptwette 50€ platziert → Balance Check: 100€ ≥ 50€ ✓
Runde 1: Sidebet 60€ platziert (gleichzeitig) → Balance Check: noch 100€ ≥ 60€ ✓
Ergebnis: Beide Wetten gebucht → Wallet = -10€
```

### Unsere Mitigation Strategy

1. **Idempotency-Keys**: Jede Wette hat einen eindeutigen Key. Doppelte Requests werden erkannt.
2. **Atomare SQL-Operationen**: `UPDATE wallet SET balance = balance - ? WHERE balance >= ?`
3. **Row-Level Locking**: `SELECT ... FOR UPDATE` sperrt die Wallet-Zeile

### Contingency Plan

- Echtzeit-Monitoring auf negative Wallet-Salden
- Bei negativem Saldo: Account sofort sperren
- Transaktions-Rollback aller offenen Wetten
- Post-Incident-Analyse der Logs

---

## Projektfortschritt seit der Halbzeitpräsentation

Seit unserer Halbzeitpräsentation haben wir bedeutende Fortschritte gemacht:

### ✅ Abgeschlossen

**Backend:**
- Vollständige Blackjack-Engine mit deterministischer Kartenverteilung (Seed + Hash)
- Wallet-System mit ACID-Transaktionen und Ledger-Ansatz
- JWT-Authentifizierung mit HttpOnly Refresh-Cookies
- Rate-Limiting auf kritischen Endpoints

**Frontend:**
- Blackjack-Spielfeld mit versteckter Dealer-Karte
- Auth-Integration mit Guards und Interceptors
- Routing-Struktur mit Angular
- RxJS-basierte State-Management

**DevOps:**
- Docker Compose Setup (Backend + MySQL)
- Cloud86 Deployment dokumentiert
- CI/CD Pipeline via GitHub Actions

### 🔄 In Bearbeitung

- Power-Up System (Frontend + Backend Integration)
- Leaderboard mit Echtzeit-Updates
- XP/Level Berechnung und Anzeige

### 📊 Aufwandsverteilung

| Person | Stunden |
|--------|---------|
| Justin | ~50h |
| Philipp | ~39h |
| J. Häuser | ~20h |
| **Gesamt** | **~108h** |

### Architektur-Highlight: Fairness via Seed + Hash

Eine unserer technischen Herausforderungen war die "beweisbare Fairness" des Spiels:

```
Runde startet → Server generiert starken Seed
→ Hash des Seeds → an Client (vor Spielbeginn sichtbar)
→ Karten werden deterministisch aus Seed berechnet
→ Nach Runde: Seed revealed → Client kann Hash verifizieren
```

Dies stellt sicher, dass der Server die Karten nicht nachträglich manipulieren kann.

---

## Nächste Schritte

1. **Diese Woche**: Power-Up Integration abschließen
2. **Nächste Woche**: Leaderboard und Daily Rewards implementieren
3. **Endspurt**: Testing, Balancing, Deployment-Finishing

Wir sind auf einem guten Weg, alle Anforderungen fristgerecht zu erfüllen.

---

*Fragen oder Anmerkungen? Gerne in den Comments unten!*
