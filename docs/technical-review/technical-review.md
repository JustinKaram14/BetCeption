# Technical Review

---

# Technical Review

## Datum und Zeitrahmen

**Datum:** 25.05.2026  
**Start:** 22:00 Uhr  
**Ende:** 24:00 Uhr  
**Dauer:** 120 Minuten

## Teilnehmer

| Rolle | Aufgabe im Review |
|---|---|
| Moderator | Jonah Häuser |
| Reviewer Frontend | Philipp Markl |
| Reviewer Backend | Justin Karam und Jonah Häuser |
| Protokoll | Philipp Markl |
| Externe Reviewer | Rafael Till und Dylan O'Reilly von "NomNomNow"|

## Ziel und Fokus des Reviews

Ziel des Reviews war es, einen realistischen Ausschnitt des Projekts zu prüfen: von der Benutzeraktion im Frontend bis zur Verarbeitung im Backend. Dadurch lassen sich nicht nur einzelne Code-Stellen bewerten, sondern auch Schnittstellen, Datenfluss und Verantwortlichkeiten zwischen Frontend und Backend.

Ausgewählt wurden bewusst die Bereiche **Authentifizierung/Session-Handling** und **Blackjack-Rundenlogik**, weil sie zentrale Anforderungen des Projekts betreffen. Authentifizierung ist sicherheitsrelevant und Grundlage für fast alle geschützten Funktionen. Die Blackjack-Runde ist fachlich komplex, da hier Spielregeln, Wetteinsatz, Wallet-Transaktionen, Powerups, XP-Fortschritt und Fairness-Nachweise zusammenlaufen.

Das Review sollte nicht jede Implementierungszeile bewerten, sondern vor allem erkennen:

- Sind Verantwortlichkeiten nachvollziehbar getrennt?
- Sind kritische Eingaben abgesichert?
- Sind fachliche Regeln im Code lesbar und testbar?
- Gibt es Stellen, die bei weiterer Entwicklung schwer wartbar werden könnten?
- Passen Frontend- und Backend-Verhalten sauber zusammen?

## Auswahl des Projektquellcodes

### Frontend

| Komponente | Pfad | Grund der Auswahl |
|---|---|---|
| Blackjack Page | `Betception-Frontend/src/app/features/casino/blackjack/pages/blackjack/blackjack.ts` | Zentrale UI-Logik für Spielstart, Hit, Stand, Settle, Powerups, Ergebnisanzeige und Wallet-Aktualisierung |
| API-Service | `Betception-Frontend/src/app/core/api/betception-api.service.ts` | Gemeinsame Schnittstelle zu Backend-Endpunkten; relevant für Konsistenz und Wartbarkeit |
| HTTP-Client Wrapper | `Betception-Frontend/src/app/core/api/http-client.ts` | Qürschnittskomponente für Base-URL, Credentials, Query-Parameter und Header |
| RNG/Game Service | `Betception-Frontend/src/app/core/services/rng/rng.ts` | Schlanke Fassadenschicht zwischen UI und API für rundenbezogene Funktionen |

### Backend

| Komponente | Pfad | Grund der Auswahl |
|---|---|---|
| Auth Controller | `Betception-Backend/src/modules/auth/auth.controller.ts` | Registrierung, Login, Refresh Token Rotation, Logout und Session-Speicherung |
| Auth Guard | `Betception-Backend/src/middlewares/authGuard.ts` | Schutz geschützter Routen und Bearer-Token-Verarbeitung |
| Rate Limiter | `Betception-Backend/src/middlewares/rateLimiters.ts` | Schutz vor Missbrauch, besonders bei Login und Refresh |
| Round Controller | `Betception-Backend/src/modules/round/round.controller.ts` | Kern der Blackjack-Fachlogik mit Transaktionen, Spielregeln, Wallet und Powerups |
| Round Schema | `Betception-Backend/src/modules/round/round.schema.ts` | Validierung für Wetteinsatz, Side Bets, Round-ID und Card-ID |

## Review-Kriterien

| Bereich | Kriterien |
|---|---|
| Codequalität | Lesbarkeit, klare Namen, reduzierte Duplikation, angemessene Funktionsgroessen |
| Wartbarkeit | Trennung von Verantwortlichkeiten, Erweiterbarkeit bei neuen Powerups oder Spielregeln |
| Security | Token-Handling, Rate Limiting, sichere Fehlermeldungen, Eingabevalidierung |
| Datenkonsistenz | Transaktionen, Wallet-Buchungen, Rundenzustände, parallele Zugriffe |
| Testbarkeit | Isolierbare Logik, vorhandene Tests, sinnvolle Fehlerfälle |
| Frontend-Backend-Vertrag | Typisierte Responses, konsistente Endpunkte, nachvollziehbares Fehlerhandling |
| User Experience | Busy States, automatische Fortsetzung aktiver Runden, verständliche Fehleranzeige |

## Review-Methode

Als Methode wurde ein **Code Review mit Walkthrough** verwendet.

Der Ablauf war:

1. Kurze Einordnung der fachlichen Use Cases.
2. Gemeinsames Lesen der ausgewählten Frontend-Komponenten.
3. Nachverfolgen der API-Aufrufe ins Backend.
4. Prüfung der Backend-Controller und Middleware anhand der Kriterien.
5. Sammlung von positiven Beobachtungen, Risiken und Verbesserungsmassnahmen.

Diese Methode passt zum aktuellen Projektstand, weil sie weniger formal ist als eine Inspektion, aber trotzdem strukturiert genug, um konkrete technische Massnahmen abzuleiten.

## Ergebnisse des Reviews

### Positive Beobachtungen

- Die Projektstruktur ist gut nachvollziehbar: Frontend-Features, Core-Services, Backend-Module, Middleware und Tests sind klar getrennt.
- Das Frontend nutzt eine zentrale API-Fassade (`BetceptionApi`) und einen HTTP-Wrapper. Dadurch müssen Base-URL, Credentials und Query-Parameter nicht in jeder Komponente einzeln behandelt werden.
- Die Blackjack-Page behandelt wichtige UI-Zustände wie `busyAction`, aktive Runden, Ergebnis-Overlay, Balance-Aktualisierung und Powerup-Inventar bereits recht vollständig.
- Backend-seitig werden kritische Rundenaktionen in Datenbanktransaktionen ausgeführt. Das ist wichtig, weil Wallet, Bets, Karten und Rundenzustand gemeinsam konsistent bleiben müssen.
- Die Rundeneingaben werden mit Zod-Schemas validiert. Besonders positiv sind Begrenzungen für Geldbeträge, Side-Bet-Anzahl und numerische IDs.
- Refresh Tokens werden serverseitig gehasht gespeichert und über ein HttpOnly-Cookie transportiert. Das ist für Session-Sicherheit eine sinnvolle Grundlage.
- Die Login-Route vermeidet durch einen Dummy-Password-Hash offensichtliche Timing-Unterschiede bei unbekannten E-Mail-Adressen.
- Rate Limiting ist nicht nur global vorhanden, sondern auch spezifisch für Login, Refresh und Powerups.
- Im Backend existieren bereits zahlreiche Tests für Controller, Middleware und Utility-Funktionen.

### Kritische Beobachtungen und Risiken

| Komponente | Beobachtung | Bewertung | Massnahme |
|---|---|---|---|
| `blackjack.ts` | Die Komponente enthält sehr viel Ablauf- und Zustandslogik: Spielaktionen, Powerups, Wallet, Overlay-Timing, Fehlerextraktion und Inventory-Loading liegen in einer Datei. | Mittleres Wartbarkeitsrisiko. Neue Spiel-Features koennen die Komponente weiter aufblähen. | Mittelfristig UI-State und Powerup-Aktionen in eigene Facade/Service-Schicht auslagern. |
| `blackjack.ts` | Mehrere `subscribe`-Aufrufe behandeln Fehler lokal und teilweise unterschiedlich. | Gering bis mittel. Fehlerverhalten kann uneinheitlich werden. | Gemeinsame Fehlerbehandlung für Spielaktionen und Powerups prüfen. |
| `BetceptionApi` | Die API-Fassade ist gut zentralisiert, wächst aber als Sammelklasse für alle Endpunkte. | Geringes aktuelles Risiko, mittelfristig Skalierungsthema. | Bei weiterem Wachstum nach Fachbereichen aufteilen, z. B. `RoundApi`, `WalletApi`, `ShopApi`. |
| `authGuard.ts` | Fehlermeldungen aus Token-Verifikation werden teilweise direkt zurückgegeben. | Geringes Security-Risiko. Details koennten Angreifern Hinweise geben. | Einheitlich generische Antwort wie "Invalid or expired token" verwenden und Details nur serverseitig loggen. |
| `rateLimiters.ts` | Der Refresh-Rate-Limiter nutzt den Refresh Token als Teil des Keys. | Funktional sinnvoll, aber sensibel, da Tokenwerte in Infrastruktur-nahe Rate-Limit-Daten gelangen koennen. | Token vor Verwendung als Key hashen oder kürzen, damit keine Roh-Tokens in Rate-Limit-Countern landen. |
| `round.controller.ts` | Die Datei bündelt sehr viele Verantwortlichkeiten: Rundenstart, Spielzug, Settlement, Powerups, Fairness, Serialization und Hilfslogik. | Hoechstes Wartbarkeitsrisiko im Review. Fachlich zentral, aber schwerer zu überblicken. | In kleinere Services aufteilen, z. B. `RoundService`, `SettlementService`, `DeckService`, `PowerupEffectService`. |
| `round.controller.ts` | Die Settlement-Logik ist korrekt transaktional gedacht, aber fachlich dicht: Main Bet, Side Bets, XP, Crates und Wallet werden in einem Ablauf verarbeitet. | Mittleres Risiko für Regressionen bei neuen Regeln. | Settlement-Logik durch gezielte Unit-Tests und kleinere pure Functions absichern. |
| `round.schema.ts` | Geldbeträge werden im Schema begrenzt und auf zwei Nachkommastellen geprüft. | Positiv. | Beibehalten; bei neuen Geld-Endpunkten dasselbe Schema oder gemeinsame Utility verwenden. |

## Abgeleitete Massnahmen

| Priorität | Massnahme | Nutzen |
|---|---|---|
| Hoch | `round.controller.ts` schrittweise in Services für Deck/Fairness, Settlement und Powerup-Effekte zerlegen | Bessere Lesbarkeit, weniger Risiko bei Änderungen an Spielregeln |
| Hoch | Refresh-Rate-Limit-Key nicht mit Roh-Token speichern, sondern gehasht ableiten | Verbesserte Security bei Log-/DB-Einsicht |
| Mittel | Einheitliche Fehlerantworten für Auth-Fehler definieren | Weniger Informationspreisgabe, konsistenter API-Vertrag |
| Mittel | Frontend-Blackjack-State in eine Facade auslagern | Komponente wird UI-näher und leichter testbar |
| Mittel | Tests für Settlement-Sonderfälle ergänzen: Blackjack, Bust, Push, Insurance/Joker, Side-Bet-Refund | Schutz gegen Regressionen in kritischer Businesslogik |
| Niedrig | API-Fassade bei weiterem Wachstum fachlich aufteilen | Bessere Orientierung im Frontend-Code |

## Gelernte Best Practices

- Bei fachlich kritischen Abläufen wie Wallet-Buchungen und Spiel-Settlement sollten Datenbanktransaktionen Standard sein.
- Security besteht nicht nur aus Token-Verifikation, sondern auch aus Rate Limiting, neutralen Fehlermeldungen und sicherer Speicherung sensibler Werte.
- Frontend-Komponenten sollten nicht daürhaft die gesamte Use-Case-Orchestrierung übernehmen. Eine Facade kann UI und Ablaufsteürung sauberer trennen.
- Validierung am Backend-Eingang ist besonders wichtig, auch wenn das Frontend bereits Eingaben begrenzt.
- Benannte Konstanten und kleine Hilfsfunktionen machen Spielregeln deutlich lesbarer als verstreute Zahlenwerte oder lange Bedingungen.
- Tests sollten dort dichter sein, wo Geld, Spielausgang oder Session-Sicherheit betroffen sind.

## Gesamtfazit

Der betrachtete Code ist für den aktüllen Projektstand solide und zeigt bereits mehrere gute Praktiken: zentrale API-Anbindung, Eingabevalidierung, Transaktionen, Token-Hashing, Rate Limiting und eine erkennbare Testbasis. Die groesste technische Spannung liegt nicht in einzelnen Fehlern, sondern in wachsender Komplexität an zentralen Stellen.

Besonders der `round.controller.ts` ist fachlich stark, aber inzwischen so umfangreich, dass weitere Features dort schnell zu schwer wartbarem Code führen koennen. Die wichtigste Empfehlung ist deshalb eine schrittweise Zerlegung entlang fachlicher Verantwortlichkeiten. Im Frontend gilt Ähnliches für die Blackjack-Page: Sie funktioniert als zentrale Steürung, sollte bei weiterem Wachstum aber durch eine klarere Facade entlastet werden.

Besonders der `round.controller.ts` ist fachlich stark, aber inzwischen so umfangreich, dass weitere Features dort schnell zu schwer wartbarem Code führen können. Die wichtigste Empfehlung ist deshalb eine schrittweise Zerlegung entlang fachlicher Verantwortlichkeiten. Im Frontend gilt Ähnliches für die Blackjack-Page: Sie funktioniert als zentrale Steuerung, sollte bei weiterem Wachstum aber durch eine klarere Facade entlastet werden.

---

# Fazit

Das Technical Review hat gezeigt, dass unser Projekt bereits eine solide Grundlage besitzt. Besonders positiv sind die klare Projektstruktur, die zentrale API-Anbindung, die Eingabevalidierung, Datenbanktransaktionen, Token-Hashing, Rate Limiting und die vorhandene Testbasis.

Gleichzeitig wurde deutlich, dass die wachsende Komplexität an zentralen Stellen aktiv reduziert werden muss. Vor allem der `round.controller.ts` im Backend und die Blackjack-Komponente im Frontend sollten langfristig besser aufgeteilt werden.
