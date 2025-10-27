# BetCeption  
## Use-Case-Realization Specification: Authentifizierung & Session Management  
Version 1.0  

---

### Revision History
| Date | Version | Description | Author |
|------|----------|--------------|--------|
| 27/10/2025 | 1.0 | Initiale Erstellung | Team BetCeption |

---

## 1. Introduction
Diese UCRS beschreibt die technische Realisierung der Authentifizierungs- und Session-Verwaltung in **BetCeption**.  
Sie deckt Registrierung, Login, Logout und die Middleware-Prüfung von JWT-Tokens ab.

### 1.1 Purpose
Ziel ist die sichere Identifikation und Verwaltung von Benutzerkonten, Sessions und Zugriffen auf geschützte Ressourcen innerhalb der Webapplikation.

### 1.2 Scope
Diese Realisierung betrifft:
- Registrierung, Login, Logout (Use Cases UC1–UC3)
- Session-Handling über JWT
- Middleware-Authentifizierung für API-Zugriffe

### 1.3 Definitions, Acronyms, and Abbreviations
- **JWT** – JSON Web Token  
- **BCrypt** – Hash-Algorithmus zur sicheren Passwortspeicherung  
- **UC** – Use Case  

### 1.4 References
- SRS BetCeption, Kapitel 3.1–3.4  
- Use Case Diagramm „Authentifizierung“  
- Sequenzdiagramme siehe Abschnitt 2  

### 1.5 Overview
Der Fokus liegt auf der technischen Sequenz und den kollaborierenden Komponenten zwischen **Frontend (Angular)**, **Backend (Express)** und **MySQL**.

---

## 2. Flow of Events — Design

### 2.1 Registrierung
1. Spieler öffnet Registrierungsseite.  
2. Gibt Benutzername, E-Mail, Passwort ein.  
3. Frontend validiert Eingaben.  
4. Backend prüft, ob E-Mail existiert.  
5. Wenn neu → Passwort wird gehasht und Benutzer angelegt.  
6. Datenbank speichert Datensatz (Benutzername, E-Mail, Hash, Startguthaben).  
7. Bestätigung wird ans Frontend gesendet.  
8. Bei Fehlern (z. B. E-Mail bereits vergeben) wird eine Fehlermeldung angezeigt.  

**Sequenzdiagramm: Registrierung**  

![alt text](<../assets/Sequenzdiagramme/Sequenzdiagramm Regestrieren.png>)

---

### 2.2 Login
1. Spieler öffnet Login-Seite und gibt E-Mail + Passwort ein.  
2. Frontend prüft Eingaben.  
3. Backend sucht Benutzerkonto per E-Mail.  
4. Wenn gefunden → Passwort wird mit Hash verglichen.  
5. Bei Erfolg wird ein JWT-Token erzeugt.  
6. Token wird im Frontend (LocalStorage) gespeichert.  
7. Benutzer wird zur Lobby weitergeleitet.  
8. Beim ersten Login des Tages wird der Daily Reward aktiviert.  

**Sequenzdiagramm: Login**  
![alt text](<../assets/Sequenzdiagramme/Sequenzdiagramm Login.png>)
---

### 2.3 Authentifizierung (Middleware)
1. Frontend sendet API-Anfrage mit JWT im Header.  
2. Middleware überprüft Signatur, Ablaufzeit, Gültigkeit.  
3. Gültige Token → Zugriff erlaubt.  
4. Ungültige Token → Antwort 401 Unauthorized.  
5. Abgelaufene Token führen zu automatischem Logout.  

---

### 2.4 Logout
1. Spieler klickt „Logout“.  
2. (Optional) System fragt nach Bestätigung.  
3. Backend erhält Logout-Anfrage und macht Token ungültig (Blacklist oder Ablauf).  
4. Frontend löscht Token aus dem Speicher.  
5. Benutzer wird zur Login-Seite weitergeleitet.  

**Sequenzdiagramm: Logout**  
![alt text](<../assets/Sequenzdiagramme/Sequenzdiagramm Logout.png>)
---

## 3. Derived Requirements
- Passwörter müssen mit **bcrypt** oder **Argon2** gehasht werden.  
- Alle Anfragen über **HTTPS**.  
- JWT muss signiert und zeitlich begrenzt sein.  
- Middleware überprüft Authentifizierung bei jedem API-Aufruf.  
- Token dürfen nach Logout nicht erneut verwendet werden.  
- UI-Fehler-Feedback für alle Authentifizierungsschritte.  
- Optional: Account-Lockout bei zu vielen Fehlversuchen.  