# Schritt 3: Images

Im dritten Schritt lädst du **Bilder** für dein Projekt hoch.

## Der Image Importer

Theaterpedia bietet einen leistungsfähigen Batch-Import für Bilder:

<div class="screenshot-placeholder">
Screenshot: Image Import Stepper - Drop Zone
</div>

### Bilder hochladen

1. **Drag & Drop** - Ziehe Bilder in die Drop-Zone
2. Oder klicke auf **"Dateien auswählen"**
3. Mehrere Bilder gleichzeitig möglich

### Unterstützte Formate

- JPEG / JPG
- PNG
- WebP
- GIF (statisch)

::: tip Empfehlung
Nutze **WebP** für beste Qualität bei kleiner Dateigröße.
:::

## Bild-Metadaten

Für jedes Bild kannst du Metadaten angeben:

<div class="screenshot-placeholder">
Screenshot: Image Refine Modal
</div>

### XMLID (Bild-Kennung)

Das Format für die Bild-ID:
```
{project}.image_{subject}.{name...}
```

Beispiel: `walfische.image_workshop.gruppenarbeit-tag1`

### Owner & Author

- **Owner** - Wem gehört das Bild? (Dropdown)
- **Author Name** - Name des Fotografen
- **Author URI** - Website/Portfolio des Fotografen

### Tags

Bilder können mit **Tags** versehen werden für bessere Organisation:

| Tag-Familie | Beschreibung |
|-------------|-------------|
| **ttags** | Thematische Tags |
| **ctags** | Content-Tags |
| **dtags** | Dokumentations-Tags |

<div class="screenshot-placeholder">
Screenshot: TagFamilies Komponente im Image Modal
</div>

## Bildverarbeitung

Nach dem Upload werden Bilder automatisch:
- In verschiedene Größen skaliert
- Für Web optimiert
- Mit Metadaten versehen

### Shapes (Bildformate)

Bilder werden in verschiedenen "Shapes" bereitgestellt:

| Shape | Größe | Verwendung |
|-------|-------|------------|
| Card | 336×224px | Karten, Vorschau |
| Tile | 128×64px | Listen, Kompaktansicht |
| Avatar | 64×64px | Profilbilder |

## Batch-Einstellungen

Für mehrere Bilder gleichzeitig:
- Gemeinsamer Owner
- Gemeinsame Tags
- Gleiche Metadaten

::: warning Hinweis
Der **"+ Add More"** Button ist derzeit deaktiviert.
:::

---

*Weiter zu [Schritt 4: Members](/de/projekt-starten/members)*
