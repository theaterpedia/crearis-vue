#!/usr/bin/env node
/**
 * green-gate — diff the current build health against a committed baseline.
 * Author: CV (tdd). Purpose: make the green-gate DELEGABLE (COORD 2026-08-05, §2·1).
 *
 * The verdict is "these N are NEW", never "is 35 worse than 34?". Pre-existing failures and
 * vitest count-drift within the envelope are NOT regressions; only a NEW failing test-file or an
 * INCREASED vue-tsc per-file error count is. Interpreting the raw numbers by memory fails silently
 * in both directions — this converts that judgement into a procedure.
 *
 * ⚠ CRITICAL — vue-tsc MUST run in build mode: `vue-tsc -b --noEmit`.
 *    The root tsconfig.json uses project `references` with `files:[]`, so a plain
 *    `vue-tsc --noEmit` type-checks NOTHING and reports 0 errors — a false green. (Discovered
 *    2026-08-05: naive `--noEmit` = 0; `-b --noEmit` = the real 480.)
 *
 * Usage:
 *   node scripts/green-gate.mjs                 # check current tree vs baseline → exit 1 on regression
 *   node scripts/green-gate.mjs --update        # re-capture and OVERWRITE the baseline
 *   node scripts/green-gate.mjs --vuetsc-file F --vitest-file G   # diff/update from pre-captured
 *                                                                  # output (separates capture from diff; CI-friendly)
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

const BASELINE = 'tests/baseline/green-gate.baseline.json'
const VUE_TSC_CMD = 'npx vue-tsc -b --noEmit'
const VITEST_OUT = '.green-gate.vitest.json'
const VITEST_CMD = `SKIP_MIGRATIONS=true npx vitest run --reporter=json --outputFile=${VITEST_OUT}`

const args = process.argv.slice(2)
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null }
const UPDATE = args.includes('--update')
const vuetscFile = opt('--vuetsc-file')
const vitestFile = opt('--vitest-file')

function sh(cmd) {
    try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 }) }
    catch (e) { return (e.stdout || '') + (e.stderr || '') } // vue-tsc/vitest exit non-zero on findings — that's expected
}
const git = (c) => { try { return execSync(`git ${c}`, { encoding: 'utf8' }).trim() } catch { return 'unknown' } }
const rel = (p) => p.replace(process.cwd() + '/', '').replace(/^.*current-root\//, '')

function parseVueTsc(raw) {
    const byFile = {}; let count = 0
    for (const line of raw.split('\n')) {
        const m = line.match(/^(.+?)\(\d+,\d+\): error TS/)
        if (m) { const f = rel(m[1]); byFile[f] = (byFile[f] || 0) + 1; count++ }
    }
    return { count, files: Object.keys(byFile).length, byFile }
}
function parseVitest(jsonPath) {
    const j = JSON.parse(readFileSync(jsonPath, 'utf8'))
    const failedFileList = (j.testResults || []).filter(t => t.status === 'failed').map(t => rel(t.name)).sort()
    return { failedFiles: failedFileList.length, failedTests: j.numFailedTests, passedTests: j.numPassedTests, totalTests: j.numTotalTests, failedFileList }
}

function capture() {
    const vueRaw = vuetscFile ? readFileSync(vuetscFile, 'utf8') : (console.error('▶ vue-tsc -b --noEmit …'), sh(VUE_TSC_CMD))
    const vueTsc = parseVueTsc(vueRaw)
    let vitestJson = vitestFile
    if (!vitestJson) { console.error('▶ vitest run (SKIP_MIGRATIONS) …'); sh(VITEST_CMD); vitestJson = VITEST_OUT }
    const vitest = parseVitest(vitestJson)
    return { vueTsc, vitest }
}

if (UPDATE) {
    const cur = capture()
    const baseline = {
        _doc: 'Green-gate baseline. Gate = NO NEW vue-tsc error-files/increased-counts and NO NEW failing vitest files vs this snapshot. Pre-existing failures + vitest count-drift are NOT regressions. Refresh with `pnpm green-gate:update` after an intentional change to the failing set.',
        capturedAt: new Date().toISOString().slice(0, 10),
        commit: git('rev-parse --short HEAD'),
        branch: git('rev-parse --abbrev-ref HEAD'),
        commands: { vueTsc: VUE_TSC_CMD, vitest: VITEST_CMD },
        vueTsc: cur.vueTsc,
        vitest: { failedFiles: cur.vitest.failedFiles, failedTests: cur.vitest.failedTests, passedTests: cur.vitest.passedTests, totalTests: cur.vitest.totalTests, failedFileList: cur.vitest.failedFileList },
        vitestDriftEnvelope: { failedFilesObserved: '34–36', failedTestsObserved: '332–334', note: 'Identical code has produced 34/332, 35/333, 36/334. Re-run before believing a regression; treat a NEW failing FILE (not a count wobble) as the signal.' },
        gates: { nitroPrepare: 'pass', viteBuild: 'pass' },
    }
    mkdirSync(dirname(BASELINE), { recursive: true })
    writeFileSync(BASELINE, JSON.stringify(baseline, null, 2) + '\n')
    console.log(`✅ baseline written → ${BASELINE}  (vue-tsc ${baseline.vueTsc.count}/${baseline.vueTsc.files} · vitest ${baseline.vitest.failedFiles} files/${baseline.vitest.failedTests} tests · @${baseline.commit})`)
    process.exit(0)
}

// --- check mode ---
if (!existsSync(BASELINE)) { console.error(`❌ no baseline at ${BASELINE} — run \`pnpm green-gate:update\` first.`); process.exit(2) }
const base = JSON.parse(readFileSync(BASELINE, 'utf8'))
const cur = capture()

const vueNew = Object.entries(cur.vueTsc.byFile).filter(([f, n]) => n > (base.vueTsc.byFile[f] || 0)).map(([f, n]) => `${f} (${base.vueTsc.byFile[f] || 0}→${n})`)
const vueFixed = Object.entries(base.vueTsc.byFile).filter(([f, n]) => (cur.vueTsc.byFile[f] || 0) < n)
const baseSet = new Set(base.vitest.failedFileList)
const curSet = new Set(cur.vitest.failedFileList)
const vitestNew = cur.vitest.failedFileList.filter(f => !baseSet.has(f))
const vitestFixed = base.vitest.failedFileList.filter(f => !curSet.has(f))

console.log(`\n─ green-gate vs baseline @${base.commit} (${base.capturedAt}) ─`)
console.log(`vue-tsc:  ${cur.vueTsc.count} errors / ${cur.vueTsc.files} files   (baseline ${base.vueTsc.count}/${base.vueTsc.files})`)
console.log(`vitest:   ${cur.vitest.failedFiles} failed files / ${cur.vitest.failedTests} tests   (baseline ${base.vitest.failedFiles}/${base.vitest.failedTests}; drift envelope ${base.vitestDriftEnvelope.failedFilesObserved} files)`)
if (vueFixed.length) console.log(`ℹ️  vue-tsc improved in ${vueFixed.length} file(s) — refresh baseline when intentional.`)
if (vitestFixed.length) console.log(`ℹ️  ${vitestFixed.length} baseline-failing test-file(s) now pass — refresh baseline when intentional.`)

const regressions = vueNew.length + vitestNew.length
if (regressions === 0) {
    console.log(`\n✅ GREEN vs baseline — 0 new regressions. (Pre-existing failures + count-drift ignored by design.)`)
    process.exit(0)
}
console.log(`\n❌ ${regressions} NEW regression(s):`)
if (vueNew.length) { console.log(`  vue-tsc — ${vueNew.length} file(s) with new/increased errors:`); vueNew.forEach(f => console.log(`    • ${f}`)) }
if (vitestNew.length) { console.log(`  vitest — ${vitestNew.length} newly-failing file(s):`); vitestNew.forEach(f => console.log(`    • ${f}`)) }
console.log(`\n(If a vitest file looks flaky not broken: re-run once — the envelope is ${base.vitestDriftEnvelope.failedFilesObserved} files.)`)
process.exit(1)
