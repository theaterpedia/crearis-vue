/**
 * uia · feeding `content/agenda.ts` → `agendaItems` into `ItemList`.
 *
 * §agenda-shape (revised): do not hand-roll a list. `pList` is only the
 * DB-fetching wrapper; `ItemList` underneath it takes `items?: ListItem[]` and
 * gates every fetch branch on `props.entity` — verified at
 * `components/clist/ItemList.vue`: `dataModeActive` is
 * `props.dataMode && (props.entity !== undefined || props.images !== undefined)`,
 * `fetchEntityData` early-returns when that is false, and `onMounted` only calls
 * it when it is true. So `items` + `:dataMode="false"` + no `entity` = theaterpedia's
 * exact row rendering with no network call. Reuse, not rebuild.
 *
 * ── Why this module exists at all ─────────────────────────────────────────────
 * One thing has to be adapted on the way in. `ItemRow.vue:61` renders
 * `<img v-else-if="cimg" :src="cimg">` — unguarded — so the `cimg: 'TODO HP'`
 * markers that `agendaItems` still carries (§8, Cloudinary URLs pending HP) would
 * each become a broken image. Stripping them here means the rows render clean now
 * and light up by themselves the moment HP pastes real URLs in.
 */

/** A `ListItem` as `ItemList` defines it (`components/clist/ItemList.vue:118`). */
export interface UiaListItem {
    heading: string
    cimg?: string
    props?: Record<string, unknown>
}

/**
 * Is this a real image URL, or one of the content-files' `TODO HP` markers?
 *
 * Single decision-point for the whole uia view-set — `UiaImage` and `UiaActors`
 * ask the same question, and they must not drift from what gets fed to ItemList.
 */
export function hasRealImage(src?: string): boolean {
    const trimmed = src?.trim()
    if (!trimmed) return false
    return !trimmed.toUpperCase().startsWith('TODO')
}

/**
 * Prepare `agendaItems` for `ItemList`.
 *
 * @param items  straight from `content/agenda.ts`
 * @param limit  the landing's `agendaTeaser.limit`; omit for the full set
 */
export function toListItems(items: ReadonlyArray<UiaListItem>, limit?: number): UiaListItem[] {
    const scoped = typeof limit === 'number' ? items.slice(0, limit) : items
    return scoped.map((item) => {
        // Drop the key entirely rather than passing '' — ItemRow's `v-else-if="cimg"`
        // treats absent and empty the same, but absent is the honest statement.
        if (!hasRealImage(item.cimg)) {
            const { cimg: _dropped, ...rest } = item
            return { ...rest }
        }
        return { ...item }
    })
}
