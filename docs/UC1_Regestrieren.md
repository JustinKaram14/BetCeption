# Use Case 1 – Registrieren

## 1.1 Brief Description
Dieser Use Case ermöglicht es einem neuen Benutzer, ein Konto in **BetCeption** zu erstellen.  
Der Benutzer gibt Benutzername, E-Mail-Adresse und Passwort ein.  
Das System prüft, ob die E-Mail bereits registriert ist, validiert die Eingaben und legt anschließend ein neues Benutzerkonto in der Datenbank an.

---

## 1.2 Mockup
**Mockup:**  
Registrierungsformular mit folgenden Feldern:
- Benutzername (Textfeld)
- E-Mail-Adresse (Textfeld)
- Passwort (Passwortfeld)
- Passwort bestätigen (Passwortfeld)
- Button: **„Registrieren“**


---

## 1.3 Screenshots
Screenshots:
- Registrierungsseite (Formular)
- Erfolgsnachricht „Konto erfolgreich erstellt“
- Fehlermeldung bei bereits existierender E-Mail


---

## 2. Flow of Events

### 2.1 Basic Flow
1. Der Benutzer öffnet die **Registrierungsseite**.  
2. Der Benutzer gibt Benutzername, E-Mail und Passwort ein.  
3. Das System überprüft die Eingaben auf Vollständigkeit und Gültigkeit.  
4. Das System prüft, ob bereits ein Konto mit dieser E-Mail existiert.  
5. Wenn kein Konto vorhanden ist, wird das neue Konto in der Datenbank angelegt.  
6. Das System zeigt eine Bestätigungsmeldung an: „Registrierung erfolgreich.“  
7. Der Benutzer kann sich nun anmelden und erhält ggf. seinen ersten Login-Bonus beim nächsten Use Case (UC 3 – Daily Reward).

---

### Activity Diagram
<img width="1226" height="678" alt="2025-10-20_14h13_28" src="https://github.com/user-attachments/assets/65669f2b-a7a8-439f-ac36-dad3aac7febb" />

---

### .feature File
*Nicht erforderlich für diesen Use Case, kann später für automatisierte Tests ergänzt werden.*

---

### 2.2 Alternative Flows

**a) Ungültige Eingaben:**  
- Wenn Pflichtfelder leer oder E-Mail ungültig sind, zeigt das System eine Fehlermeldung an:  
  *„Bitte füllen Sie alle Felder korrekt aus.“*  
- Benutzer bleibt auf der Registrierungsseite.

**b) E-Mail bereits registriert:**  
- Das System zeigt an:  
  *„Ein Konto mit dieser E-Mail existiert bereits.“*  
- Benutzer kann versuchen, sich einzuloggen oder Passwort zurückzusetzen.

---

## 3. Special Requirements
- Passwort muss mindestens **8 Zeichen** lang sein.  
- Passwort muss **mindestens eine Zahl** und **ein Sonderzeichen** enthalten.  
- E-Mail-Adresse muss ein **gültiges Format** haben.  
- E-Mail ist **unique** (nicht doppelt erlaubt).  
- Alle Eingaben müssen **client- und serverseitig** validiert werden.

---

## 4. Preconditions
- Benutzer hat die App oder Website **BetCeption** gestartet.  
- Benutzer befindet sich auf der **Registrierungsseite**.

---

## 5. Postconditions
- Neues Benutzerkonto ist in der **Datenbank gespeichert**.  
- Benutzer kann sich anschließend mit seinen Daten **einloggen**.

---

### 5.1 Save changes / Sync with server
- Nach erfolgreicher Registrierung werden folgende Daten gespeichert:
  - Benutzername
  - E-Mail
  - Passwort-Hash
  - Startguthaben (z. B. 1000 Coins)
  - Erstellungsdatum  
- Die Daten werden in der **MySQL-Datenbank** synchronisiert.  
- Benutzer kann sich anschließend über das Login-System (**UC 2**) anmelden.

---

## 6. Function Points
| Komponente | Beschreibung | Punkte |
|-------------|---------------|--------|
| Formularfelder | Benutzername, E-Mail, Passwort | 2 |
| Validierungslogik | Eingabeprüfung | 1 |
| Datenbank-Insert | Benutzer anlegen | 2 |
| Erfolgsmeldung & Weiterleitung | Bestätigung | 1 |
| **Gesamt** | | **6 FP** |

---

