# Page-Heading im Detail

::: info Für Fortgeschrittene
Diese Seite erklärt das 3-Ebenen-Konfigurationssystem des Page-Heading-Systems.
:::

## Das 3-Ebenen-Prinzip

Das Page-Heading-System nutzt eine **Kaskade** von Einstellungen, die sich gegenseitig überschreiben können:

```
┌─────────────────────────────────────────────────────────────┐
│  Ebene 1: Basis-Typ (System)                                │
│  ─────────────────────────────────                          │
│  Grundlegende Typen: banner, cover, columns, simple         │
│  Definiert das Grundverhalten                               │
└─────────────────────────┬───────────────────────────────────┘
                          │ überschrieben von
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Ebene 2: Theme-Variante                                    │
│  ─────────────────────────                                  │
│  Theme-spezifische Anpassungen                              │
│  z.B. "Banner für Regio-Theme" mit anderen Gradienten       │
└─────────────────────────┬───────────────────────────────────┘
                          │ überschrieben von
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Ebene 3: Projekt-Überschreibung                            │
│  ───────────────────────────────                            │
│  Deine individuellen Einstellungen pro Projekt              │
│  + Einstellungen pro einzelnem Beitrag/Event                │
└─────────────────────────────────────────────────────────────┘
```

## Wie die Kaskade funktioniert

### Beispiel: Ein Event erstellen

1. **System-Standard**: `cover` mit 75% Höhe, zentriertes Bild
2. **Dein Theme** (z.B. "Modern"): Fügt einen dunklen Gradient hinzu
3. **Dein Projekt**: Standard-Event-Header auf `medium` (50%) gesetzt
4. **Dieses Event**: Du wählst `full` (100%) für besondere Betonung

**Ergebnis**: Cover-Layout, 100% Höhe, mit Theme-Gradient

## Theme-Varianten

Jedes Theme kann eigene Header-Varianten definieren. Diese werden automatisch angewendet, wenn dein Projekt das entsprechende Theme verwendet.

| Theme | Beispiel-Anpassung |
|-------|-------------------|
| Regio | Stärkerer Gradient, größere Schrift |
| Modern | Transparenter Overlay, minimalistisch |
| Classic | Klassischer Schatten, traditionell |

::: tip Automatisch
Du musst nichts tun! Wenn du das Theme wechselst, werden die passenden Header-Varianten automatisch verwendet.
:::

## Die Einstellungsebenen

### Projekt-Ebene (ThemeConfigPanel)

Im Dashboard unter **Konfiguration** legst du fest:

| Einstellung | Wirkt auf |
|-------------|-----------|
| Projekt-Homepage Header | Die Startseite `/sites/deinprojekt` |
| Standard Post Header | Neue Beiträge (Voreinstellung) |
| Standard Event Header | Neue Events (Voreinstellung) |

### Eintrags-Ebene (AddPostPanel / EventPanel)

Beim Erstellen einzelner Einträge:
- **Header Type**: Banner, Cover, Spalten, etc.
- **Header Size**: Mini, Medium, Prominent, Voll

Diese Werte werden **gespeichert** und überschreiben die Projekt-Standards für diesen einen Eintrag.

## Banner vs. Cover: Der Unterschied

Beide Typen nutzen ein vollbreites Hintergrundbild. Der Unterschied liegt in der **Bild-Ausrichtung**:

```
┌─────────────────────────────────────────────────────────────┐
│  BANNER: Bild oben ausgerichtet                             │
│  ───────────────────────────────                            │
│                                                             │
│  ┌─────────────────────────────┐                           │
│  │ 🌅 Horizont sichtbar        │ ← Oberer Bildrand fixiert │
│  │    Himmel, Berge            │                           │
│  │    ─────────────────────    │                           │
│  │    (unterer Teil ggf. ab-   │                           │
│  │     geschnitten)            │                           │
│  └─────────────────────────────┘                           │
│                                                             │
│  ✓ Gut für: Landschaften, Panoramen, Skylines              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  COVER: Bild zentriert                                      │
│  ─────────────────────                                      │
│                                                             │
│  ┌─────────────────────────────┐                           │
│  │    (oberer Teil ggf. ab-    │                           │
│  │     geschnitten)            │                           │
│  │    ─────────────────────    │                           │
│  │ 👤 Gesicht/Motiv zentriert  │ ← Bildmitte im Fokus      │
│  │    ─────────────────────    │                           │
│  │    (unterer Teil ggf. ab-   │                           │
│  │     geschnitten)            │                           │
│  └─────────────────────────────┘                           │
│                                                             │
│  ✓ Gut für: Portraits, Gruppen, zentrierte Motive          │
└─────────────────────────────────────────────────────────────┘
```

## Tipps für die Bildauswahl

| Header-Typ | Empfohlenes Bildformat | Tipp |
|------------|------------------------|------|
| Banner (mini/medium) | Querformat 16:9 | Wichtiges Motiv im oberen Drittel |
| Banner (prominent/full) | Hochformat oder Quadrat | Mehr vom Bild sichtbar |
| Cover | Quadrat oder Hochformat | Motiv in der Bildmitte |
| Spalten | Hochformat 2:3 | Wird neben dem Text angezeigt |

::: warning Bildqualität
Verwende hochauflösende Bilder (mind. 1440px Breite) für beste Ergebnisse auf großen Bildschirmen.
:::

## Zusammenfassung

1. **Theme wählen** → Farben & Schriften + automatische Header-Varianten
2. **Projekt-Standards setzen** → Einheitliches Erscheinungsbild
3. **Bei Bedarf überschreiben** → Individuelle Anpassung pro Eintrag

Das 3-Ebenen-System sorgt für Konsistenz bei gleichzeitiger Flexibilität.
