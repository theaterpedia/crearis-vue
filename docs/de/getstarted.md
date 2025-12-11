# Erste Schritte mit Theaterpedia

Willkommen bei Theaterpedia! Diese Anleitung führt dich durch die ersten Schritte – vom Erstellen deines Kontos bis zum Aufbau deines ersten Projekts.

---

## Teil 1: Dein Konto einrichten (User-Onboarding)

### Schritt 1: Registrierung

Nach der Registrierung erhältst du ein neues Benutzerkonto. Dein Konto startet im Status **"Neu"** und muss noch eingerichtet werden.

### Schritt 2: Profil vervollständigen

Um Theaterpedia vollständig nutzen zu können, musst du:

1. **Deinen Namen eingeben** – Wie möchtest du in der Community genannt werden?
2. **Ein Profilbild hochladen** – Dein Avatar wird bei deinen Beiträgen angezeigt

Sobald beide Angaben gemacht sind, wird dein Konto automatisch aktiviert und du erhältst Zugang zu allen Funktionen.

> 💡 **Tipp:** Ein aussagekräftiges Profilbild hilft anderen, dich in Projekten wiederzuerkennen.

---

## Teil 2: Projekt erstellen – Die zwei frühen Phasen

Wenn du ein neues Projekt erstellst, durchläuft es zwei frühe Phasen, bevor es für alle Mitglieder sichtbar wird:

### Phase 1: NEU (Einrichtung)

| | |
|---|---|
| **Wer sieht das Projekt?** | Nur der Projekt-Owner |
| **Was kann man tun?** | Grundeinstellungen vornehmen |
| **Andere Rollen?** | Noch nicht aktiv |

In dieser Phase richtest du das Grundgerüst deines Projekts ein. Nur du als Owner hast Zugang.

### Phase 2: DEMO (Vorbereitung)

| | |
|---|---|
| **Wer sieht das Projekt?** | Owner, Creator und Members |
| **Was kann man tun?** | Inhalte vorbereiten, Team einladen |
| **Sichtbarkeit für Members?** | Nur Vorschau (Lesen) |

In der Demo-Phase kannst du:
- **Events anlegen** – Termine und Veranstaltungen planen
- **Posts erstellen** – Artikel und Ankündigungen schreiben  
- **Bilder hochladen** – Medien für dein Projekt sammeln
- **Team einladen** – Weitere Personen zum Projekt hinzufügen

#### Der Stepper

Als Owner oder Creator siehst du einen **Stepper** – eine Schritt-für-Schritt-Anleitung, die dich durch die Einrichtung führt:

1. **Events** – Erstelle deine ersten Termine
2. **Posts** – Schreibe Ankündigungen oder Artikel
3. **Bilder** – Lade Bilder für dein Projekt hoch
4. **Akteure** – Lade Teammitglieder ein
5. **Einstellungen** – Konfiguriere dein Projekt

> 📝 **Hinweis:** Die Reihenfolge kann je nach Projekttyp variieren.

#### Was Members in der Demo-Phase sehen

Members, die du einlädst, sehen eine **Vorschau** deines Projekts. Sie können:
- ✅ Events, Posts und Bilder ansehen
- ❌ Noch keine eigenen Inhalte erstellen

Sobald du das Projekt **aktivierst** (Status → ENTWURF), erhalten Members volle Bearbeitungsrechte.

---

## Teil 3: Die drei Projekt-Rollen

In jedem Projekt gibt es drei Hauptrollen mit unterschiedlichen Rechten:

### 👑 Projekt-Owner (Eigentümer)

Der Owner ist der Gründer und Administrator des Projekts.

| Berechtigung | NEW | DEMO | ENTWURF+ |
|--------------|-----|------|----------|
| Projekt sehen | ✅ | ✅ | ✅ |
| Stepper nutzen | ✅ | ✅ | – |
| Inhalte bearbeiten | ✅ | ✅ | ✅ |
| Team verwalten | ✅ | ✅ | ✅ |
| Projekt aktivieren | ✅ | ✅ | ✅ |
| Rollen vergeben | ✅ | ✅ | ✅ |

**Der Owner kann:**
- Das Projekt löschen oder archivieren
- Andere zum Creator oder Member machen
- Alle Einstellungen ändern

### ✨ Projekt-Creator (Mitgestalter)

Creator sind enge Mitarbeiter, die das Projekt mitaufbauen dürfen.

| Berechtigung | NEW | DEMO | ENTWURF+ |
|--------------|-----|------|----------|
| Projekt sehen | ✅ | ✅ | ✅ |
| Stepper nutzen | ✅ | 👁 (Vorschau) | – |
| Inhalte bearbeiten | ✅ | ✅ | ✅ |
| Team einladen | ❌ | ❌ | ✅ |

**Wie wird man Creator?**
Der Owner kann jedes Mitglied zum Creator befördern. Dies geschieht in den Projekteinstellungen unter "Akteure".

### 👤 Projekt-Member (Mitglied)

Members sind aktive Teilnehmer am Projekt.

| Berechtigung | NEW | DEMO | ENTWURF+ |
|--------------|-----|------|----------|
| Projekt sehen | ❌ | 👁 (Vorschau) | ✅ |
| Stepper nutzen | ❌ | ❌ | – |
| Inhalte erstellen | ❌ | ❌ | ✅ |
| Eigene Inhalte bearbeiten | ❌ | ❌ | ✅ |

**Ab ENTWURF können Members:**
- Eigene Posts schreiben
- Events erstellen
- Bilder hochladen
- An Diskussionen teilnehmen

---

## Teil 4: Inhalte erstellen – Der Post-Creator

Hier kommt ein wichtiges Konzept: **Jeder, der einen Inhalt erstellt, wird automatisch dessen Creator.**

### Das Prinzip

Wenn du – egal ob Owner, Creator oder Member – einen neuen Post erstellst, bist du der **Post-Creator** und hast volle Rechte auf diesen spezifischen Post.

```
Du erstellst einen Post → Du bist Post-Creator → Volle Rechte auf diesen Post
```

### Wo erstellt man Inhalte?

Inhalte werden auf der **Sites-Route** erstellt:

- **Posts:** `/sites/{projektname}/posts`
- **Events:** `/sites/{projektname}/events`
- **Bilder:** `/sites/{projektname}/images`

### Was bedeutet "Post-Creator"?

| Als Post-Creator kannst du: |
|---|
| ✅ Den Post bearbeiten |
| ✅ Bilder hinzufügen oder entfernen |
| ✅ Den Post zur Überprüfung einreichen |
| ✅ Kommentare moderieren |

### Unterschied: Projekt-Creator vs. Post-Creator

| | Projekt-Creator | Post-Creator |
|---|---|---|
| **Bezug** | Ganzes Projekt | Einzelner Post |
| **Vergeben durch** | Owner | Automatisch beim Erstellen |
| **Rechte** | Alle Projektinhalte | Nur dieser eine Post |

**Beispiel:**
- Anna ist **Member** im Projekt "Sommerfest"
- Sie erstellt einen Post "Programm-Vorschau"
- Anna ist jetzt **Post-Creator** dieses Posts
- Sie kann den Post jederzeit bearbeiten
- Andere Posts kann sie nur lesen (außer sie erstellt weitere)

---

## Zusammenfassung

### Der typische Ablauf

```
1. REGISTRIEREN
   └─→ Name + Avatar eingeben
   
2. PROJEKT ERSTELLEN (als Owner)
   └─→ Phase: NEU
       └─→ Grundeinstellungen
   
3. TEAM EINLADEN
   └─→ Phase: DEMO
       └─→ Creator & Members hinzufügen
       └─→ Inhalte vorbereiten
   
4. PROJEKT AKTIVIEREN
   └─→ Phase: ENTWURF
       └─→ Alle Members können mitarbeiten
   
5. INHALTE ERSTELLEN
   └─→ Route: /sites/{projekt}/posts
       └─→ Jeder Ersteller = Post-Creator
```

### Die Rollen auf einen Blick

| Rolle | Symbol | Kann in DEMO | Kann ab ENTWURF |
|-------|--------|--------------|-----------------|
| Owner | 👑 | Alles | Alles |
| Creator | ✨ | Vorschau + Stepper | Alles bearbeiten |
| Member | 👤 | Nur Vorschau | Eigene Inhalte erstellen |

### Wichtige Begriffe

| Begriff | Bedeutung |
|---------|-----------|
| **Projekt-Owner** | Gründer und Admin des Projekts |
| **Projekt-Creator** | Mitgestalter mit erweiterten Rechten |
| **Projekt-Member** | Aktives Mitglied |
| **Post-Creator** | Ersteller eines einzelnen Beitrags |
| **Stepper** | Schritt-für-Schritt-Einrichtung |
| **Sites-Route** | Bereich zum Erstellen von Inhalten |

---

## Häufige Fragen

### Wie mache ich jemanden zum Creator?

1. Gehe zu deinem Projekt
2. Öffne "Einstellungen" → "Akteure"
3. Wähle das Mitglied aus
4. Klicke auf "Zum Creator befördern"

### Wann können Members Inhalte erstellen?

Erst ab der Phase **ENTWURF**. In der DEMO-Phase können Members nur die Vorschau sehen.

### Kann ich Rechte wieder entziehen?

Ja, der Owner kann jederzeit:
- Creator zu Members herabstufen
- Members aus dem Projekt entfernen

### Was passiert mit Posts, wenn jemand das Projekt verlässt?

Die Posts bleiben erhalten. Der Owner kann einen neuen Creator für diese Posts bestimmen.

---

> 🚀 **Bereit loszulegen?** Erstelle jetzt dein erstes Projekt und lade dein Team ein!
