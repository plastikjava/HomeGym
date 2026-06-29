# Google Drive Cloud-Sync: Schritt-für-Schritt-Anleitung

Diese Anleitung erklärt dir genau, wie du die Google Drive Cloud-Synchronisation in deiner **HomeGym** App einrichtest.

Da es sich bei HomeGym um eine private App auf deiner eigenen Vercel-Subdomain handelt, musst du in der Google Cloud Console einmalig eine eigene **Client-ID** erstellen. Dies schützt deine Daten und sorgt dafür, dass nur du Zugriff auf dein Google Drive hast.

---

## 🛠️ Schritt 1: Google Cloud Projekt erstellen

1. Öffne die [Google Cloud Console](https://console.cloud.google.com/) im Browser.
2. Melde dich mit deinem normalen Google-Konto an.
3. Klicke ganz oben links (neben dem Google Cloud-Logo) auf das Projekt-Dropdown und wähle **"Neues Projekt"** (New Project).
4. Gib dem Projekt einen Namen, z. B. **`HomeGym`**, und klicke auf **"Erstellen"** (Create).
5. Warte kurz, bis das Projekt erstellt wurde, und wähle es aus.

---

## 🔑 Schritt 2: Google Drive API aktivieren

1. Klicke oben links auf das Menü-Symbol (drei Striche) und gehe auf **"APIs & Dienste"** ➔ **"Bibliothek"** (APIs & Services ➔ Library).
2. Suche in der Suchleiste nach **`Google Drive API`**.
3. Klicke auf das Suchergebnis und anschließend auf den blauen Button **"Aktivieren"** (Enable).

---

## 📝 Schritt 3: OAuth-Zustimmungsbildschirm konfigurieren

Bevor du die Client-ID erstellen kannst, muss Google wissen, wie die App heißt:

1. Klicke im Menü links auf **"OAuth-Zustimmungsbildschirm"** (OAuth consent screen).
2. Wähle als Nutzertyp **"Extern"** (External) und klicke auf **"Erstellen"**.
3. Fülle nur die Pflichtfelder aus:
   - **App-Name:** `HomeGym`
   - **Nutzer-Support-E-Mail:** Deine Google-Adresse.
   - **E-Mail-Adresse des Entwicklers:** Deine Google-Adresse.
4. Klicke auf **"Speichern und fortfahren"** (Save and Continue).
5. **Bereiche (Scopes):** Klicke auf "Bereiche hinzufügen oder entfernen" und füge den Scope `.../auth/drive.file` hinzu (ermöglicht der App, eine Backup-Datei in deinem Drive zu erstellen). Klicke auf "Speichern und fortfahren".
6. **Testnutzer (Wichtig!):** 
   - Da die App im Entwicklungsmodus ("Testing") ist, musst du dich selbst als Testnutzer eintragen.
   - Klicke auf **"Add Users"** (Nutzer hinzufügen), trage deine **eigene Google-E-Mail-Adresse** ein und klicke auf Hinzufügen.
   - Klicke auf **"Speichern und fortfahren"**.

---

## 🆔 Schritt 4: OAuth-Client-ID erstellen

Jetzt erstellen wir die eigentliche ID für die App:

1. Klicke im linken Menü auf **"Anmeldedaten"** (Credentials).
2. Klicke ganz oben auf **"+ Anmeldedaten erstellen"** ➔ **"OAuth-Client-ID"** (Create Credentials ➔ OAuth client ID).
3. Wähle als Anwendungstyp **"Webanwendung"** (Web application).
4. Trage im Feld **Name** ein: `HomeGym Web App`.
5. Scroll nach unten zu **"Autorisierte JavaScript-Quellen"** (Authorized JavaScript origins) und klicke auf **"URL hinzufügen"**:
   - Trage hier deine Vercel-Domain ein: `https://home-8bsihy2xn-plastikworld.vercel.app`
   - *(Optional für lokales Testen auf dem PC)* Füge eine weitere Zeile hinzu: `http://localhost:3000`
6. Scroll weiter nach unten zu **"Autorisierte Weiterleitungs-URIs"** (Authorized redirect URIs) und klicke auf **"URL hinzufügen"**:
   - Trage hier exakt dieselbe URL mit einem Schrägstrich am Ende ein: `https://home-8bsihy2xn-plastikworld.vercel.app/`
   - *(Optional für lokales Testen)* Füge hinzu: `http://localhost:3000/`
7. Klicke auf **"Erstellen"** (Create).
8. Ein Pop-up zeigt dir nun deine **Client-ID** an (eine lange Kette, die auf `.apps.googleusercontent.com` endet). Kopiere diese ID!

---

## 📲 Schritt 5: Synchronisation in der App nutzen

1. Öffne deine **HomeGym** App auf dem Handy.
2. Klicke oben rechts auf das **Zahnrad-Symbol** (Einstellungen).
3. Gehe auf den Reiter **"Backup & Sync"**.
4. Füge deine kopierte Client-ID in das Eingabefeld unter **"Google Client-ID"** ein und tippe auf **"Speichern"**.
5. Klicke auf **"Jetzt sichern"**:
   - Ein Google-Anmeldefenster öffnet sich.
   - Melde dich mit deinem Google-Konto an.
   - *Hinweis:* Google warnt dich eventuell, dass die App nicht überprüft ist (das ist normal bei privaten Projekten). Klicke einfach auf **"Erweitert"** ➔ **"Weiter zu HomeGym (unsicher)"**.
6. Nach der Anmeldung wirst du automatisch zurück zur App geleitet.
7. Oben siehst du nun den aktuellen Status: `Letzter Sync: [Aktuelles Datum und Uhrzeit]`.

Ab jetzt kannst du jederzeit mit einem Klick deine Daten sichern oder auf einem neuen Gerät wiederherstellen!
