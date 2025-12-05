# Schritt 4: Members

Im vierten Schritt konfigurierst du dein **Team**.

::: info Nur für Projekt-Owner
Dieser Schritt ist nur sichtbar, wenn du **Owner** des Projekts bist.
:::

## Rollen im Projekt

Theaterpedia verwendet ein **rollen-basiertes** System:

| Rolle | Bit-Wert | Beschreibung |
|-------|----------|--------------|
| **Owner** | - | Projektbesitzer, volle Kontrolle |
| **Partner** | 2 | Enger Mitarbeiter, erweiterte Rechte |
| **Participant** | 4 | Aktiver Teilnehmer |
| **Member** | 8 | Basis-Mitglied |

## Team-Mitglieder hinzufügen

<div class="screenshot-placeholder">
Screenshot: Members-Verwaltung im Stepper
</div>

1. Klicke auf **"Mitglied hinzufügen"**
2. Suche nach dem Benutzer (E-Mail oder Name)
3. Wähle die **Rolle** aus
4. Bestätige

### Benutzer finden

Du kannst Benutzer suchen nach:
- E-Mail-Adresse
- Benutzername
- @theaterpedia.org Adresse

::: tip
Benutzer müssen bereits bei Theaterpedia registriert sein.
:::

## Rollen-Berechtigungen

### Owner
- Kann alles bearbeiten
- Kann Mitglieder hinzufügen/entfernen
- Kann Projekt löschen
- Sieht alle Schritte im Stepper

### Partner
- Kann Inhalte bearbeiten
- Kann Events und Posts erstellen
- Sieht eingeschränkte Admin-Optionen

### Participant
- Kann eigene Beiträge erstellen
- Sieht reduzierte Optionen

### Member
- Basis-Zugang
- Kann kommentieren
- Sieht öffentliche Inhalte

## Sichtbarkeit

Inhalte können auf bestimmte Rollen beschränkt werden:
- **r_partner** - Nur für Partner sichtbar
- **r_participant** - Für Participant und höher
- **r_member** - Für alle Mitglieder

<div class="screenshot-placeholder">
Screenshot: Rollen-Sichtbarkeit Einstellung
</div>

## Mitglieder verwalten

In der Übersicht siehst du alle Team-Mitglieder:
- Name und E-Mail
- Aktuelle Rolle
- Beitrittsdatum

### Rolle ändern

1. Klicke auf den Benutzer
2. Wähle die neue Rolle
3. Speichern

### Mitglied entfernen

::: warning Achtung
Entfernte Mitglieder verlieren sofort den Zugang zum Projekt.
:::

---

*Weiter zu [Schritt 5: Design](/de/projekt-starten/design)*
