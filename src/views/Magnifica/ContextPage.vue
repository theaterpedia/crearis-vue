<!--
  ContextPage · /context · Page 2 · "Organic intellectual, grounded practice".
  Per candidate-1a/page-2-bio.md (v1.0). English abstract → German body (4 paragraphs,
  rendered inside a lang="de" section for screen-reader correctness) → English closing
  question. 8 inline CalloutPhrase triggers (c-bio-1..7 + c-bio-foot). Bilingual is
  structural, not decorative.
-->

<template>
  <div class="magnifica-page">
    <TopNav :items="navItems" navbar-mode="page" scroll-style="simple">
      <template #actions>
        <MagnificaLogoutButton />
      </template>
    </TopNav>

    <!-- Hero · portrait BackSlide (manifest §5) · hero text in the panel -->
    <BackSlide
      class="bio-portrait"
      :image="portrait.image"
      :image-alt="portrait.imageAlt"
      theme-color="green"
    >
      <p class="bio-hero-overline">{{ hero.overline }}</p>
      <h1 class="bio-hero-headline">{{ hero.headline }}</h1>
    </BackSlide>

    <main class="magnifica-page-content">
      <!-- §1 · English abstract -->
      <section class="page-section">
        <p>
          <CalloutPhrase :callout="callouts.organicIntellectual">Organic intellectual</CalloutPhrase>
          is Antonio Gramsci's term, carried into Cultural Studies through Stuart Hall: someone whose theoretical work emerges from sustained involvement in the practical life of a community, not from a chair in academia. Hans Dönitz has been <em>trying to be</em> an organic intellectual since 1996 — Gestalter (not founder) of DAS Ei Theaterpädagogisches Institut Bayern e.V. in Augsburg, <em>leitet seit drei Jahrzehnten</em> the institute's curricular and methodological development, embedded in a Verein-collective structure that is <em>constitutionally</em> outside corporate logic. The structural position your Vatican remarks named — practitioner outside AI-industry incentive structures, with humanities-rooted methodology over decades — is biographically grounded here.
        </p>
        <p>
          Hans actively maintains the institute's public presence at
          <CalloutPhrase :callout="callouts.daseiEu">dasei.eu</CalloutPhrase>
          — built on the
          <CalloutPhrase :callout="callouts.theaterpediaOrg">theaterpedia.org</CalloutPhrase>
          content-database (the platform itself in early alpha; the underlying database production-mature). The institutional voice in German that the rest of this page references in English-and-German both.
        </p>
      </section>

      <!-- §2 · German body · lang="de" for screen-reader correctness -->
      <section class="page-section" lang="de">
        <h2 class="page-section-heading">In seiner eigenen Sprache</h2>

        <p>
          Theaterpädagogik lebt vom Anfang. Von dem Moment, in dem sich eine Gruppe zum ersten Mal im Raum begegnet und etwas entsteht, das vorher nicht da war. Hans Dönitz hat diesen Anfängen sein Berufsleben gewidmet. Seit 30 Jahren arbeitet er bei DAS Ei daran, Menschen den Einstieg ins Theaterspiel zu eröffnen — und ihnen danach die Werkzeuge an die Hand zu geben, um selbst theatral arbeiten zu können. Sein Ausgangspunkt ist die
          <CalloutPhrase :callout="callouts.elementareAnimation">„Elementare Animation"</CalloutPhrase>:
          eine Methodik, bei der der/die Anleitende nicht erklärt, sondern zeigt. Die Gruppe kommt in Bewegung, bevor der Kopf verstanden hat, was geschieht. <em>„Am Anfang war der Kreis"</em> — so heißt das erste Seminar der Grundlagenbildung. Es ist zugleich Programm und Philosophie: Im Kreis sind alle gleich, jeder sieht jeden, und der Anfang braucht nicht mehr als Präsenz und Aufmerksamkeit.
        </p>

        <p>
          Hans unterrichtet quer durch das
          <CalloutPhrase :callout="callouts.curriculum">mehrstufige DAS-Ei-Curriculum</CalloutPhrase>
          — von den <em>Einstiegen ins Theaterspiel</em> über die Grundlagenbildung und die zweijährige Aufbaustufe. Was alle Stufen verbindet: ein prozessorientierter Ansatz, der auf Vertrauen setzt — <em>„Wege entstehen beim Gehen"</em>, <em>„Mit Theater Grenzen bewegen"</em> — Strukturen geben Sicherheit, der eigentliche Lernprozess entfaltet sich im Tun.
        </p>

        <p>
          Theaterpädagogik ist zu 90 Prozent analoge Arbeit; doch
          <CalloutPhrase :callout="callouts.infrastruktur">die Infrastruktur, die sie sichtbar macht</CalloutPhrase>
          — Öffentlichkeitsarbeit, Terminplanung, Wissenstransfer — braucht digitale Werkzeuge. Hans hat 2022 die Entwicklung von <em>theaterpedia.org</em> angestoßen — einer Plattform, auf der theaterpädagogische Organisationen vernetzte Webpräsenzen aufbauen können. DAS Ei mit <em>dasei.eu</em> ist die erste Organisation, die diese Infrastruktur produktiv nutzt; weitere Websites sollen folgen.
        </p>

        <p>
          DAS Ei ist ein eingetragener Verein — und das ist kein Zufall. Theaterpädagogik versteht sich als sozial engagierter Prozess, nicht als Dienstleistung eines Einzelnen. Niemand hat hier eine feste Stelle; die Arbeit wird auf Honorarbasis und im Ehrenamt geleistet. Das operative Herz bildet seit drei Jahren eine
          <CalloutPhrase :callout="callouts.institutsleitung">vierköpfige Institutsleitung</CalloutPhrase>,
          die die unterschiedlichen Bereiche gemeinsam verantwortet — getragen von einem unabhängig gewählten Vereinsvorstand, in den Hans bewusst nicht eintritt, um die Trennung zwischen Geschäftsführung und Vereinsorganen zu wahren. Den weiteren Kreis bilden rund dreißig Vereinsmitglieder, jedes Jahr ergänzt durch zehn bis zwanzig Absolvent:innen, von denen einige dem Verein beitreten, sobald ihre Zeit dafür gekommen ist. Auf dieser Basis hat DAS Ei (unter Leitung von Hans Dönitz, Eleanora Allerdings, Rosalin Hertrich sowie Karel Hájek) den Aufbau zweier weiterer Organisationen mitgetragen: die Cojc gGmbH in Bayern (https://cojc.eu) und A Basta! (občanské sdružení) in der Tschechischen Republik, die beide ein wichtiges Stück Infrastruktur für die Theaterpädagogik in Bayern und Tschechien bedeuten. Parallel dazu ist Hans treibende Kraft hinter Theaterpedia e.V. — einem Verein (in Gründung), der den digitalen Wandel im Berufsfeld vorantreibt und in mehreren Präsenzkonferenzen mit 20–30 Teilnehmer:innen die Grundlagen für eine vernetzte Zukunft gelegt hat. <em>„Alles ist Kooperation"</em> — dieser Satz fällt immer wieder, wenn Hans über seine Arbeit spricht. Er beschreibt damit nicht nur eine pädagogische Methode, sondern
          <CalloutPhrase :callout="callouts.selbstverstaendnis">ein Selbstverständnis</CalloutPhrase>:
          Ob im Seminarraum, in der Vereinsarbeit oder bei der Entwicklung digitaler Werkzeuge — es geht darum, gemeinsam etwas aufzubauen, das größer ist als die Summe der einzelnen Beiträge.
        </p>
      </section>

      <!-- §3 · closing English question + links -->
      <section class="page-section page-section--closing">
        <p><em>Organic intellectual</em> is a tradition, not a credential. The question is not whether someone qualifies. The question is whether the position is currently held — and what the Anthropic-encounter might do with it.</p>
        <pre class="page-codefence"><code>The institute, in its own voice — https://dasei.eu
The platform (early alpha) — https://theaterpedia.org</code></pre>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import TopNav from '@/components/TopNav.vue'
import MagnificaLogoutButton from './MagnificaLogoutButton.vue'
import CalloutPhrase from './CalloutPhrase.vue'
import BackSlide from '@/components/magnifica/BackSlide.vue'
import { navItems } from './content/nav'
import { hero, portrait, callouts } from './content/context'
</script>

<style scoped>
.magnifica-page {
  font-family: var(--font, ui-monospace);
  min-height: 100vh;
  background: var(--color-bg, #1a1a1a);
  color: var(--color-contrast, #f4f4f4);
}

.magnifica-page-content {
  max-width: 56rem;
  margin: 0 auto;
  padding: clamp(2rem, 5vh, 4rem) clamp(1rem, 5vw, 2rem);
}

/* ==Portrait BackSlide hero== · face anchored top (north-cropped source) so cover
   never clips Hans's head, regardless of the image-window ratio. */
.bio-portrait :deep(.panel-image) {
  background-position: center top;
}

.bio-hero-overline {
  font-size: 0.875rem;
  margin: 0 0 0.5rem;
  letter-spacing: 0.02em;
  opacity: 0.85;
}

.bio-hero-headline {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 700;
  margin: 0;
  line-height: 1.2;
}

.page-section {
  margin: 0 0 clamp(2rem, 4vh, 3.5rem);
}

.page-section-heading {
  font-size: clamp(1.25rem, 2.5vw, 1.75rem);
  font-weight: 700;
  margin: 0 0 1rem;
  color: var(--color-primary-bg);
}

.page-section p {
  font-size: clamp(0.95rem, 1.5vw, 1.0625rem);
  line-height: 1.7;
  margin: 0 0 1rem;
  color: var(--color-contrast, #e8e8e8);
}

.page-section p:last-child {
  margin-bottom: 0;
}

.page-codefence {
  background: var(--color-popover-bg, #0f0f0f);
  color: var(--color-popover-contrast, #d0d0d0);
  padding: 1.5rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.8125rem;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
  border: 1px solid rgba(255, 238, 0, 0.15);
  margin: 1rem 0 0;
}

.page-codefence code {
  font-family: inherit;
  color: inherit;
}

.page-section--closing {
  margin-top: clamp(2rem, 5vh, 4rem);
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
