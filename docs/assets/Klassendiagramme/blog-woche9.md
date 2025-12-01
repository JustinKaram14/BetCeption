# Architektur-Blog Woche 9

## Was wir diese Woche gemacht haben
- **Doku-Fokus:** Alle Use-Case-Spezifikationen unter `docs/use-cases/` aktualisiert (aktueller Implementierungsstand, neue Sequenz- und Aktivitätsdiagramme direkt in den Use-Case-Dokumenten, konsistente Benennung).
- **UCRS vervollständigt:** Sämtliche Use-Case-Realisierungen in `docs/use-case-realisation/` fertiggestellt und mit den UC-Spezifikationen verlinkt – bereit, sie in GitHub Discussions zu referenzieren.
- **SAD fertiggestellt:** 4+1-Sichten konsolidiert, Pfade/Referenzen auf die neuen UC/UCRS-Strukturen angepasst, Encoding/Nummerierung bereinigt; liegt unter `docs/architecture/SAD.md`.
- **ASR/Utility Tree synchronisiert:** Ziele und Taktiken im Utility Tree geprüft, damit die Doku den aktuellen Stand reflektiert.

## Architektur-Struktur (Kurz)
- **Use Case View:** UC1–UC10 mit aktualisierten Diagrammen, Realisierungen in den UCRS-Dokumenten.
- **Logical View:** Feature-Folder (auth, round, wallet, powerups, leaderboard, rewards, inventory, shop), Entities im separaten Layer; Angular spiegelt die Domänen.
- **Process/Deployment:** Flows für Auth, Round/Bet, Daily Reward dokumentiert; Deployment als SPA → Node/Express → MySQL (Docker Compose).


## Nächste Schritte bis zur Präsentation
- **Frontend-Bugs fixen**, damit Blackjack end-to-end spielbar ist (Deal/Hit/Stand/Settle; Sidebets/Power-Ups sobald unterstützt).
- **Doku-Feinschliff**


## Links (für Discussions)
- Use Cases: `docs/use-cases/`
- UCRS (Realisierungen mit Sequenz-/Aktivitätsdiagrammen): `docs/use-case-realisation/`
- SAD (Software Architecture Document): `docs/architecture/SAD.md`
- Utility Tree: `docs/architecture/utility-tree.md`
- ADRs: `docs/architecture/architecture-decisions.md`
