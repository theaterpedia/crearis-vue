# Themes, Layout und Page-Heading

::: info Übersicht
Diese Seite erklärt wie du das visuelle Erscheinungsbild deines Projekts anpasst.
:::

## Das Zusammenspiel

Dein Projekt-Aussehen wird durch drei Bereiche bestimmt:

```
┌─────────────────────────────────────────────────────────────┐
│                    Dein Projekt                              │
├───────────────┬───────────────────┬─────────────────────────┤
│    Theme      │      Layout       │     Page-Heading        │
│               │                   │                         │
│  Farben &     │  Struktur der     │  Header-Bereich am      │
│  Schriften    │  Seiten           │  Seitenanfang           │
│               │                   │                         │
│  🎨           │  📐               │  🖼️                     │
└───────────────┴───────────────────┴─────────────────────────┘
```

## Theme

Das **Theme** bestimmt Farben und Schriften deines Projekts. Du wählst es im Dashboard unter **Konfiguration → Theme & Page Headers**.

Jedes Theme hat:
- **Primärfarbe** - Buttons, Links, Akzente
- **Hintergrundfarben** - Hell/Dunkel-Modus
- **Schriftarten** - Überschriften und Fließtext

::: tip Theme wechseln
Ein Theme-Wechsel wirkt sich sofort auf alle Seiten deines Projekts aus.
:::

## Layout

::: warning In Entwicklung
Der Layout-Bereich wird noch entwickelt. Hier kannst du zukünftig die Seitenstruktur anpassen.
:::

## Page-Heading

Das **Page-Heading** ist der Header-Bereich am Anfang jeder Seite. Es zeigt typischerweise:
- Titelbild (Cover-Image)
- Titel und Untertitel
- Optional: Gradient-Overlay

### Einstellungen im Dashboard

Im **Theme & Page Headers** Panel findest du drei Bereiche:

| Bereich | Beschreibung |
|---------|--------------|
| **Projekt-Homepage** | Header für deine Hauptseite unter `/sites/deinprojekt` |
| **Standard für Beiträge** | Voreinstellung für neue Posts |
| **Standard für Events** | Voreinstellung für neue Veranstaltungen |

### Header-Typen

| Typ | Beschreibung | Bild-Position |
|-----|--------------|---------------|
| **Banner** | Vollbreiter Header | Bild oben ausgerichtet |
| **Cover** | Vollbreiter Header | Bild zentriert |
| **Spalten** | Text + Bild nebeneinander | Separates Bild |
| **Einfach** | Nur Text, kein Bild | — |
| **Bauchbinde** | Band-Overlay am unteren Rand | Bild zentriert |

### Header-Größen

| Größe | Höhe | Empfehlung |
|-------|------|------------|
| **Mini** | 25% | Kompakte Header, mehr Platz für Inhalt |
| **Medium** | 50% | Ausgewogene Darstellung |
| **Prominent** | 75% | Betonung des Bildes |
| **Voll** | 100% | Bildschirmfüllend, immersiv |

### Individuelle Anpassung

Beim Erstellen eines neuen Posts oder Events werden die **Projekt-Standards** als Voreinstellung verwendet. Du kannst diese für jeden Eintrag individuell anpassen:

1. Öffne das **Add Post** oder **Add Event** Panel
2. Scrolle zu **Header Type** und **Header Size**
3. Wähle deine gewünschten Einstellungen

::: tip Tipp
Für Konsistenz empfehlen wir, die Projekt-Standards zu nutzen und nur bei Bedarf einzelne Einträge anzupassen.
:::

## Weiterführende Informationen

- [Page-Heading Details](./page-heading-details.md) - Technische Details zum 3-Ebenen-System
