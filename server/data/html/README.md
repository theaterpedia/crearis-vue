# Demo Data - Applied Theatre Participants

## Quick Start

**View the demo data:**
```bash
# Option 1: Run the script
./view-demo-data.sh

# Option 2: Open directly
xdg-open index.html
```

**Navigation:**
All HTML files have a navigation bar at the top for easy browsing between categories:
- **Übersicht** (index.html): Overview with statistics
- **Theaterpädagog:innen** (instructors.html): 20 educators
- **Kinder 6-12** (children.html): 15 children
- **Jugendliche 13-17** (teens.html): 15 teenagers
- **Erwachsene 18+** (adults.html): 15 adults
- **Workshop-Orte** (locations.html): 30 locations
- **Workshop-Situationen** (events.html): 30 events/workshops

## Overview
Demo data for res.partner and event.event import into crearis-vue system.
Focus: Applied Theatre, Theatre of the Oppressed, Drama in Education

**Total Entries: 125**
- 65 Persons (Instructors & Participants)
- 30 Workshop Locations
- 30 Workshop Events/Situations
- 7 Blog Posts (linked to events/locations)

## Geographic Distribution

### Germany - Bavaria
**München Region (majority):**
- Schwabing, Maxvorstadt, Neuhausen, Lehel (central districts)
- Giesing, Sendling, Ramersdorf, Obersendling (south)
- Neuperlach, Hasenbergl (diverse neighborhoods)
- Pasing, Laim, Bogenhausen (west/east)
- Haidhausen (east)

**Augsburg Region:**
- Altstadt, Göggingen, Pfersee, Haunstetten, Lechhausen

**Nürnberg Region:**
- Südstadt, Altstadt, Gostenhof, Johannis, Wöhrd

### Czech Republic
- **Plzeň (Pilsen)**: Border region, strong youth exchange programs
- **Aš**: Small border town with German-Czech cooperation
- **Praha (Prague)**: Capital, theater education hub

## Categories

### 1. Instructors (20 persons)
**File:** `instructors.html`

**Demographics:**
- 85% German/Bavarian names
- 15% Migration background (Turkish 2, Russian 2, Syrian 1, Palestinian 1, Iraqi 1, Nigerian 1, Ukrainian 1, Polish 1, Czech 2, Ghanaian 1)
- Gender: 50% female, 50% male
- Age range: 33-56 years
- Geographic: 12 München, 3 Augsburg, 3 Nürnberg, 2 Czech Republic

**Expertise:**
- Theatre of the Oppressed (Boal methods)
- Applied Theatre
- Forum Theatre
- Drama in Education
- Intercultural theatre work
- German-Czech youth exchange programs
- Trauma-sensitive theatre
- Documentary theatre
- Inclusive theatre

### 2. Children (15 persons, ages 6-12)
**File:** `children.html`

**Demographics:**
- 50% German/Bavarian names
- 50% Migration background (Syrian 2, Guinean 1, Turkish 1, Iraqi 1, Afghan 1, Ukrainian 1, Somali 1, Eritrean 1)
- Gender: Mixed
- Age range: 8-11 years
- Geographic: 11 München, 2 Augsburg, 2 Nürnberg

**Characteristics:**
- Diverse cultural backgrounds reflecting Munich's demographics
- Various levels of German language proficiency
- Mix of shy/expressive personalities
- Different artistic interests (dance, storytelling, music, visual arts)

### 3. Teens (15 persons, ages 13-17)
**File:** `teens.html`

**Demographics:**
- 50% German/Bavarian names  
- 50% Migration background (Syrian 2, Nigerian 1, Turkish 2, Iraqi 1, Ukrainian 1, Ghanaian 1)
- Gender: Mixed
- Age range: 14-17 years
- Geographic: 11 München, 2 Augsburg, 2 Nürnberg

**Interests:**
- Political theatre and social activism
- Identity and belonging themes
- Environmental theatre
- Hip-hop/urban culture integration
- Spoken word/poetry
- Technical theatre (lights, sound)
- Feminist theatre
- Historical/regional theatre

### 4. Adults (15 persons, ages 18+)
**File:** `adults.html`

**Demographics:**
- 85% German/Bavarian names
- 15% Migration background (Turkish 2, Russian 2)
- Gender: 50% female, 50% male
- Age range: 33-58 years
- Geographic: 11 München, 2 Augsburg, 2 Nürnberg

**Profiles:**
- Teachers using drama-in-education
- Social workers with theatre training
- Healthcare workers (nurses)
- Retired professionals (seniors theatre)
- Business people (corporate theatre)
- IT professionals
- Journalists
- Architects

## Unsplash Image References

### Collections Used:
- **Portraits & Faces**: General portrait photography
- **People Worldwide**: Diverse cultural backgrounds
- **Children/Youth**: Age-appropriate imagery
- **Professional Portraits**: Adult participants
- **Diverse Faces**: Multi-cultural representation

### Photographers Featured:
- Christopher Campbell
- Joseph Gonzalez
- Stephanie Harvey
- Ayo Ogunseinde (multiple)
- Michael Dam
- Godisable Jacob
- Thought Catalog
- Behrouz Sasani
- And many others

### Image Key Format:
Unsplash URLs: `https://unsplash.com/photos/[KEY]`
- Example: `https://unsplash.com/photos/5MRsjiv782c`
- Key: `5MRsjiv782c`

**Note:** The actual image keys in the HTML files are examples. For production use, you should:
1. Search Unsplash with specific queries (drama education, multicultural youth, etc.)
2. Find suitable images that match the demographic profiles
3. Extract the actual photo keys from Unsplash URLs
4. Update the HTML files with real keys
5. Ensure compliance with Unsplash License and attribution requirements

## Migration Backgrounds Represented

### Middle East:
- Syria (multiple - reflecting 2015-2016 refugee wave)
- Iraq (multiple)
- Palestine
- Afghanistan

### Africa:
- Nigeria
- Guinea
- Somalia
- Eritrea
- Ghana

### Eastern Europe:
- Ukraine (post-2022 arrivals)
- Russia
- Poland
- Czech Republic

### Mediterranean:
- Turkey (largest minority group in Germany)

## Usage Notes

1. **Data Format**: HTML preview files for visual review
2. **Next Step**: Convert to CSV or JSON for database import
3. **Address Format**: District, City format (realistic Munich addresses)
4. **Teaser Texts**: Include relevant context for each person
5. **Unsplash Attribution**: All images must credit photographers per Unsplash License

## Import to res.partner

Suggested fields mapping:
- `name`: Full name
- `city`: Extracted from address
- `street`: District/area
- `country`: Germany or Czech Republic
- `category`: instructor/child/teen/adult
- `comment`: Teaser text
- `image_unsplash_key`: Unsplash photo key
- `image_collection`: Collection name
- `image_author`: Photographer name

## Statistics

**Total Entries:** 125
- **Persons:** 65 (Instructors: 20, Children: 15, Teens: 15, Adults: 15)
- **Locations:** 30 (Workshop venues across Bayern & Tschechien)
- **Events:** 30 (Workshops, courses, projects, festivals)
- **Blog Posts:** 7 (German: 4, Czech: 3)

**Geographic Distribution (Persons):**
- München: 45 (69%)
- Augsburg: 9 (14%)
- Nürnberg: 9 (14%)
- Czech Republic: 2 (3%)

**Geographic Distribution (Locations):**
- München Region: 18 (60%)
- Augsburg Region: 4 (13%)
- Nürnberg Region: 3 (10%)
- Czech Republic: 5 (17% - Plzeň, Aš, Praha)

**Migration Background:**
- Children: 50%
- Teens: 50%
- Instructors: 15%
- Adults: 15%
- **Overall**: ~35% with migration background

**Bavarian/German Names:**
- Children: 50%
- Teens: 50%
- Instructors: 85%
- Adults: 85%

## New Content

### 5. Workshop Locations (30 entries)
**File:** `locations.html`

Workshop venues and performance spaces for Applied Theatre in Bayern and Czech Republic:
- **München**: Schwere Reiter, ECHO e.V., Substanz, Theater 44, ASZ Hasenbergl, TAM OST, Freizeittreff Pasing, IBZ, Kammerspiele
- **Augsburg**: Bürgerzentrum Göggingen, Kulturhaus abraxas, St. Anna Forum
- **Nürnberg**: Passage 13, Bildungszentrum im Quartier, Bildungszentrum Nürnberg
- **Plzeň**: Divadlo ALFA (main Czech partner)
- **Aš**: Divadlo Aš (border region theater)
- **Praha**: Studio ALTA (international hub)

**Each location includes:**
- Overline-Headline: Type · City-District
- Headline: Location name
- Subline: Brief description
- Info grid: Address, capacity, rooms, special features
- Description: ~150 words about programming and focus
- Blog posts: 50% have 1-2 related posts
- Unsplash reference: Key, collection, author

### 6. Workshop Events (30 entries)
**File:** `events.html`

Courses, workshops, projects and festivals:
- **Weekend workshops**: Forum-Theater, Playback-Theater, Drama in Education
- **Summer projects**: Multi-day intensive programs for youth
- **Certificate courses**: Professional development for educators
- **Long-term projects**: Theatre of the Oppressed, community theater
- **International exchanges**: German-Czech youth meetings
- **Festivals**: Applied Theatre festivals in Prague

**Event types:**
- Kurse (ongoing courses)
- Workshops (1-3 days)
- Projekte (long-term projects)
- Ferienprojekte (holiday programs)
- Fortbildungen (professional training)
- Festivals (multi-day events)

**Each event includes:**
- Overline-Headline: Type · City
- Headline: Event title
- Subline: Brief description
- Info grid: Date, location, duration, target group
- Description: ~150-200 words about content and methods
- Participation box: Fees, registration, leadership
- Blog posts: 50% have 1-2 related posts
- Unsplash reference: Key, collection, author

### 7. Blog Posts (7 entries)
**Directory:** `posts/`

Articles written by instructors or collectives, relating to specific events/locations:

**German posts (4):**
1. `forum-theater-workshop-schwere-reiter.html` - Katrin Maier on Forum-Theater methodology
2. `playback-theater-giesing.html` - Jonas Bauer on Playback-Theater practice
3. `theater-der-unterdruckten-augsburg.html` - Kollektiv on political theater & housing justice
4. `mehrsprachiges-theater-muenchen.html` - Amira Al-Shabibi (Syrian background) on multilingual theater
5. `drama-in-education-nuernberg.html` - Dr. Sabine Herrmann on DiE in schools

**Czech posts (3 from Plzeň):**
6. `divadlo-alfa-mezinarodni-projekt.html` - Jana Nováková on international youth exchange
7. `forum-divadlo-plzen.html` - Jana Nováková on Forum Theatre in Pilsen
8. `studio-alta-mezinarodni-festival.html` - Studio ALTA team on Prague festival

**Post features:**
- Full-page articles (~800-1200 words)
- Personal perspective from practitioners
- Mixture of gendered/non-gendered German
- Czech posts entirely in Czech language
- 2 posts reflect migration backgrounds (Amira Al-Shabibi's personal story)
- Links back to locations.html and events.html

### 8. Unsplash Collections Summary
**File:** `UNSPLASH_SUMMARY.md`

Comprehensive documentation of all Unsplash photographers and collections used:
- **18 photographers** documented
- **~40 collections** across themes
- Main photographers: Samuel Zeller (6), Alexandre Chambon (5), Antenna (4)
- Thematic groupings: Workshop spaces, cultural centers, theater venues, educational spaces
- Keywords for further searches
- Style consistency notes

**Search recommendations by theme:**
- Workshop situations: Samuel Zeller, Alexandre Chambon, Antenna
- Diverse participants: Husna Miskandar, Florian Schmetz
- Czech locations: Alexandre Chambon, Henrique Ferreira, Mikita Yo

## Next Steps

1. Review HTML files visually
2. Search actual Unsplash images for each profile
3. Update with real Unsplash keys
4. Convert to CSV for import
5. Import to res.partner table
6. Link to projects (Applied Theatre, Theatre of the Oppressed, etc.)
