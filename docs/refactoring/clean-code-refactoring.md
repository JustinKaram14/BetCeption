# Clean Code Refactoring – Zusammenfassung

## Überblick

Im Rahmen der Clean-Code-Überarbeitung wurden vier Dateien im Backend überarbeitet.
Ziel war es, Inkonsistenzen zu beseitigen, Duplizierungen zu entfernen und die
Lesbarkeit des Codes zu verbessern – ohne das externe Verhalten zu verändern.

---

## 1. Stringly-typed Fehlerbehandlung → Typisierte Fehlerklassen

**Betroffene Dateien:**
- `Betception-Backend/src/modules/shop/shop.controller.ts`
- `Betception-Backend/src/modules/rewards/rewards.controller.ts`

**Problem (vorher):**  
Fehler wurden als einfache `Error`-Objekte geworfen, deren `message`-Feld einen
internen Code-String enthielt (z. B. `throw new Error('INSUFFICIENT_FUNDS')`).
Die Fehlerbehandlung prüfte dann diesen String mit `err?.message === 'CODE'`.
Das führte zu:
- Fehleranfälligkeit durch Tippfehler im String-Vergleich
- Fehlender Typsicherheit (`catch (err: any)`)
- Inkonsistenz mit den übrigen Modulen (`round`, `powerups`, `wallet`), die
  bereits typisierte Fehlerklassen verwendeten

**Lösung (nachher):**  
In beiden Modulen wurden dedizierte Fehlerklassen eingeführt (`ShopError`,
`RewardError`) – analog zum bereits vorhandenen Muster in `RoundFlowError`,
`WalletAdjustmentError` und `PowerupConsumptionError`. Die `catch`-Blöcke
wurden auf `catch (error: unknown)` umgestellt und delegieren an eine
`handleXxxError`-Funktion, die `instanceof`-Checks verwendet.

**Clean Code Prinzip:** *Use Exceptions Rather Than Return Codes* (Kap. 7) –
Fehlertypen sollen klar und typsicher sein; der `any`-Typ in `catch`-Blöcken
umgeht die Typsicherheit und verbirgt Bugs.

```typescript
// vorher – fragil und nicht typsicher
} catch (err: any) {
  const code = err?.message ?? 'UNKNOWN';
  if (code === 'INSUFFICIENT_FUNDS') { ... }
  if (code === 'LEVEL_TOO_LOW') { ... }
  throw err;
}

// nachher – typsicher und konsistent mit dem Rest der Codebasis
} catch (error) {
  return handleShopError(res, error);
}

function handleShopError(res: Response, error: unknown) {
  if (error instanceof ShopError) {
    return res.status(error.statusCode).json({ message: error.message, code: error.code });
  }
  throw error;
}
```

---

## 2. Duplizierter Ausdruck durch vorhandene Konstante ersetzt

**Betroffene Datei:**
- `Betception-Backend/src/modules/auth/auth.controller.ts`

**Problem (vorher):**  
Am Anfang der Datei ist `REFRESH_TTL_MS` korrekt als Konstante definiert:

```typescript
const REFRESH_TTL_MS = env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000;
```

Dennoch wurde dieselbe Berechnung in den Funktionen `login` und `refresh`
redundant wiederholt:

```typescript
// in login()
const refreshExpiresAt = new Date(Date.now() + env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000);

// in refresh()
const refreshExpiresAt = new Date(Date.now() + env.jwt.refreshTtlDays * 24 * 60 * 60 * 1000);
```

**Lösung (nachher):**  
Beide Stellen verwenden nun die bereits vorhandene Konstante:

```typescript
const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);
```

**Clean Code Prinzip:** *DRY – Don't Repeat Yourself* (Kap. 2 / „The Pragmatic
Programmer") – Jede Wissenseinheit soll genau einmal im System vorhanden sein.
Doppelte Berechnungen erhöhen das Risiko, dass bei einer Änderung (z. B. der
TTL-Konfiguration) nur eine Stelle angepasst wird.

---

## 3. Magic Numbers → Benannte Konstanten für Auszahlungsmultiplikatoren

**Betroffene Datei:**
- `Betception-Backend/src/modules/round/round.controller.ts`

**Problem (vorher):**  
In der Funktion `resolveMainBet` wurden Auszahlungs-Multiplikatoren als bare
Zahlen verwendet (`0`, `1`, `2`, `2.5`), ohne deren Bedeutung zu kommunizieren:

```typescript
if (playerHand.status === HandStatus.BLACKJACK && ...) {
  return { status: MainBetStatus.WON, multiplier: 2.5 };  // was bedeutet 2.5?
}
if (dealerHand.status === HandStatus.BUSTED) {
  return { status: MainBetStatus.WON, multiplier: 2 };
}
```

**Lösung (nachher):**  
Vier benannte Konstanten wurden eingeführt:

```typescript
const PAYOUT_BLACKJACK = 2.5;  // Blackjack zahlt 3:2 → Einsatz + 1.5x = 2.5x
const PAYOUT_WIN       = 2;    // Normaler Gewinn → Einsatz zurück + 1x Gewinn
const PAYOUT_PUSH      = 1;    // Unentschieden → nur Einsatz zurück
const PAYOUT_LOSS      = 0;    // Verlust → kein Rückgabebetrag
```

**Clean Code Prinzip:** *Avoid Magic Numbers* (Kap. 2) – Zahlen ohne Namen
zwingen Leser dazu, die Geschäftslogik aus dem Kontext zu rekonstruieren.
Benannte Konstanten machen die Absicht sofort verständlich und ermöglichen es,
Regeln an einer einzigen Stelle zu ändern.

---

## 4. Extrahierte Hilfsfunktion für wiederholtes Muster

**Betroffene Datei:**
- `Betception-Backend/src/modules/round/round.controller.ts`

**Problem (vorher):**  
In `evaluateSideBet` wurde die Logik „Wette gewonnen → WON mit Multiplikator,
sonst LOST mit 0" dreimal identisch wiederholt – für Farbe, Farbe und Rang:

```typescript
if (sideBet.predictedColor === actualColor) {
  return { status: SideBetStatus.WON, multiplier: oddsValue, isRefund: false };
}
return { status: SideBetStatus.LOST, multiplier: 0, isRefund: false };

// ... und nochmal für suit ...
if (sideBet.predictedSuit === targetCard.suit) {
  return { status: SideBetStatus.WON, multiplier: oddsValue, isRefund: false };
}
return { status: SideBetStatus.LOST, multiplier: 0, isRefund: false };

// ... und nochmal für rank ...
```

**Lösung (nachher):**  
Eine private Hilfsfunktion `resolveSideBetOutcome` kapselt dieses Muster:

```typescript
function resolveSideBetOutcome(won: boolean, oddsValue: number): SideBetResolution {
  return won
    ? { status: SideBetStatus.WON, multiplier: oddsValue, isRefund: false }
    : { status: SideBetStatus.LOST, multiplier: 0, isRefund: false };
}

// Aufrufe – deutlich lesbarer:
if (code === 'FIRST_CARD_COLOR') {
  return resolveSideBetOutcome(sideBet.predictedColor === actualColor, oddsValue);
}
if (code === 'FIRST_CARD_SUIT') {
  return resolveSideBetOutcome(sideBet.predictedSuit === targetCard.suit, oddsValue);
}
if (code === 'FIRST_CARD_RANK') {
  return resolveSideBetOutcome(sideBet.predictedRank === targetCard.rank, oddsValue);
}
```

**Clean Code Prinzip:** *DRY* und *Extract Function* (Kap. 3) – Wiederholter Code
soll in eine benannte Funktion ausgelagert werden, deren Name die Absicht erklärt.

---

## 5. Lesbares `for...of` statt `reduce` mit Promises

**Betroffene Datei:**
- `Betception-Backend/src/modules/round/round.controller.ts`

**Problem (vorher):**  
Die Funktion `dealInitialCards` verwendete `Array.prototype.reduce` mit einem
accumulator-Promise, um vier Karten sequenziell auszuteilen:

```typescript
function dealInitialCards(...) {
  const sequence = [playerHand, dealerHand, playerHand, dealerHand];
  return sequence.reduce<Promise<void>>(async (prev, hand) => {
    await prev;
    const card = drawCardFromSeed(serverSeed, usedCards);
    await addCardToHand(manager, hand, card);
  }, Promise.resolve());
}
```

Dieses Muster ist ein bekanntes Anti-Pattern: `reduce` mit Promises ist schwer
lesbar, fehleranfällig (alle Iterationen starten sofort; der `await prev` sorgt
zwar für Serialisierung, ist aber nicht intuitiv) und wird in Code Reviews häufig
falsch verstanden.

**Lösung (nachher):**  
Einfache `async`-Funktion mit `for...of`-Schleife:

```typescript
async function dealInitialCards(...): Promise<void> {
  const sequence = [playerHand, dealerHand, playerHand, dealerHand];
  for (const hand of sequence) {
    const card = drawCardFromSeed(serverSeed, usedCards);
    await addCardToHand(manager, hand, card);
  }
}
```

**Clean Code Prinzip:** *Write Code for Humans* / *Principle of Least Surprise* –
Code soll so geschrieben sein, dass seine Absicht auf den ersten Blick klar ist.
`for...of` mit `await` ist das idiomatische TypeScript/JavaScript-Muster für
sequenzielle asynchrone Operationen.

---

## 6. Magic Number im Token-Parsing entfernt

**Betroffene Datei:**
- `Betception-Backend/src/middlewares/authGuard.ts`

**Problem (vorher):**  
Der `Authorization`-Header wurde mit `header.substring(7)` geparst, wobei `7` die
Länge des Strings `'Bearer '` ist – eine typische Magic Number:

```typescript
if (!header?.startsWith('Bearer ')) { ... }
const token = header.substring(7);
```

Die Zahl `7` kommuniziert keine Absicht. Ein Leser muss selbst zählen oder wissen,
dass `'Bearer '` genau 7 Zeichen hat. Bei einer hypothetischen Änderung des
Prefix würde die magische Zahl leicht vergessen.

**Lösung (nachher):**  
Eine benannte Konstante `BEARER_PREFIX` wurde eingeführt. Der Token-Schnitt
verwendet nun `BEARER_PREFIX.length`, sodass die Zahl aus dem String selbst
abgeleitet wird:

```typescript
const BEARER_PREFIX = 'Bearer ';

if (!header?.startsWith(BEARER_PREFIX)) { ... }
const token = header.slice(BEARER_PREFIX.length);
```

**Clean Code Prinzip:** *Avoid Magic Numbers* (Kap. 2) – Jede Zahl soll durch
einen sprechenden Namen ersetzt werden; `BEARER_PREFIX.length` macht unmissverständlich
klar, *warum* genau so viele Zeichen übersprungen werden.

---

## 7. Vierstellige `||`-Kette durch `Set`-Lookup ersetzt

**Betroffene Datei:**
- `Betception-Backend/src/modules/round/round.controller.ts`

**Problem (vorher):**  
In `evaluateHand` wurde geprüft, ob eine Karte den Wert 10 hat, mit einer
viergliedrigen Oder-Kette:

```typescript
} else if (
  card.rank === CardRank.KING ||
  card.rank === CardRank.QUEEN ||
  card.rank === CardRank.JACK ||
  card.rank === CardRank.TEN
) {
  total += 10;
}
```

Das ist schwer zu lesen und schwer zu erweitern: möchte man einen neuen Rang
hinzufügen (unwahrscheinlich, aber als Gedankenexperiment), muss man die Kette
kennen und verlängern.

**Lösung (nachher):**  
Eine Modul-Konstante `TEN_VALUE_RANKS` als `Set<CardRank>` wurde eingeführt.
Die Prüfung wird zu einem einzeiligen Mitgliedstest:

```typescript
const TEN_VALUE_RANKS = new Set([CardRank.KING, CardRank.QUEEN, CardRank.JACK, CardRank.TEN]);

// in evaluateHand:
} else if (TEN_VALUE_RANKS.has(card.rank)) {
  total += 10;
}
```

**Clean Code Prinzip:** *Simplify Conditionals* / *Intention-Revealing Names* (Kap. 2 & 4) –
Die Gruppe der 10-Wert-Karten ist eine konzeptuelle Einheit; ein benanntes `Set`
macht diese Einheit explizit und ersetzt einen impliziten 4-Wege-Vergleich durch
einen semantisch klaren `has`-Aufruf.

---

## 8. Hilfsvariable beim Tauschen durch Destructuring-Zuweisung ersetzt

**Betroffene Datei:**
- `Betception-Backend/src/modules/round/round.controller.ts`

**Problem (vorher):**  
Der Fisher-Yates-Shuffle in `buildSeededDeck` verwendete eine temporäre Variable,
um zwei Array-Elemente zu tauschen – das klassische, aber geschwätzige C-Idiom:

```typescript
const temp = deck[i];
deck[i] = deck[j];
deck[j] = temp;
```

Drei Zeilen für eine konzeptuelle Einheit (Tausch), dazu eine Variable `temp`,
die nur als Durchgangswert existiert und nach der Zuweisung keinen Zweck mehr hat.

**Lösung (nachher):**  
Destructuring-Zuweisung – das idiomatische TypeScript/JavaScript-Muster für
einen Swap ohne Hilfsvariable:

```typescript
[deck[i], deck[j]] = [deck[j], deck[i]];
```

**Clean Code Prinzip:** *Use Language Idioms* / *Write Code for Humans* –
Destructuring-Swaps sind in modernem TypeScript Standard; sie eliminieren die
Hilfsvariable und bringen die Absicht (Tausch zweier Elemente) auf eine einzige,
selbstsprechende Zeile.

---

## Zusammenfassung der Änderungen

| # | Datei | Änderung | Clean Code Prinzip |
|---|-------|----------|--------------------|
| 1 | `shop.controller.ts` | `ShopError`-Klasse + typisierter `catch` | Use Exceptions, Typsicherheit |
| 2 | `rewards.controller.ts` | `RewardError`-Klasse + typisierter `catch` | Use Exceptions, Typsicherheit |
| 3 | `auth.controller.ts` | `REFRESH_TTL_MS`-Konstante konsequent genutzt | DRY |
| 4 | `round.controller.ts` | Benannte Payout-Konstanten (`PAYOUT_WIN`, etc.) | Avoid Magic Numbers |
| 5 | `round.controller.ts` | `resolveSideBetOutcome`-Hilfsfunktion | DRY, Extract Function |
| 6 | `round.controller.ts` | `for...of` statt `reduce` mit Promise-Accumulator | Readability, Least Surprise |
| 7 | `authGuard.ts` | `BEARER_PREFIX`-Konstante statt Magic Number `7` | Avoid Magic Numbers |
| 8 | `round.controller.ts` | `TEN_VALUE_RANKS`-Set statt 4-facher `\|\|`-Kette | Simplify Conditionals |
| 9 | `round.controller.ts` | Destructuring-Swap statt `temp`-Variable | Use Language Idioms |
