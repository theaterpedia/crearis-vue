#!/usr/bin/env python3
"""Two-way pseudonymisation for content files.

Clearnames must never land on a git branch. This script holds the line in
three modes:

    check   — exit 1 if any clearname appears (the guard; use as pre-commit hook)
    anon    — clearname  ->  CODE   (run before committing)
    deanon   — CODE      ->  clearname (run on prod only, after github-ops)

The mapping lives in `.pseudonyms.env` at the repo root — gitignored, never
committed. One line per person:

    CODE="Canonical Clearname|another surface|Lastname"

The FIRST surface is canonical: `deanon` writes it back. The remaining
surfaces are additional spellings `check`/`anon` must also catch (first name
alone, last name alone, a maiden name, a misspelling seen in the wild).

Matching is case-insensitive and whole-word, longest surface first — so
"Anna Lisa Berg" is consumed before "Anna". `anon` is therefore lossy by
design: many surfaces collapse to one code, and a round-trip returns the
canonical spelling rather than the original one.

Both `anon` and `deanon` report only unless `--write` is passed.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

MAPPING_FILE = ".pseudonyms.env"

SKIP_DIRS = {
    ".git", "node_modules", "dist", ".nuxt", ".output", ".vite",
    "coverage", ".cache", "venv", ".venv", "__pycache__",
}

# Anything that is not text we can safely rewrite.
SKIP_SUFFIXES = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".svg",
    ".pdf", ".zip", ".gz", ".tar", ".woff", ".woff2", ".ttf", ".otf",
    ".mp3", ".mp4", ".mov", ".wav", ".sqlite", ".db", ".node",
}


class Mapping:
    """code -> surfaces, plus the compiled matcher for the clear direction."""

    def __init__(self, entries: dict[str, list[str]]):
        self.entries = entries
        self.canonical = {code: surfaces[0] for code, surfaces in entries.items()}
        # Codes are written in house style (Basan, MATTIS30) but matched
        # case-insensitively, so resolve them through an upper-cased key.
        self.canonical_upper = {
            code.upper(): surfaces[0] for code, surfaces in entries.items()
        }

        # Longest surface first, so a full name wins over its parts.
        pairs: list[tuple[str, str]] = [
            (surface, code)
            for code, surfaces in entries.items()
            for surface in surfaces
        ]
        pairs.sort(key=lambda p: len(p[0]), reverse=True)
        self.surface_to_code = dict(pairs)

        self.clear_re = self._whole_word([surface for surface, _ in pairs])
        self.code_re = self._whole_word(sorted(entries, key=len, reverse=True))

    @staticmethod
    def _whole_word(terms: list[str]) -> re.Pattern | None:
        if not terms:
            return None
        # Lookarounds rather than \b: \b would fire inside "Anna-Lisa" the way
        # we want, but would also split on the umlauts some surfaces carry.
        body = "|".join(re.escape(t) for t in terms)
        return re.compile(rf"(?<!\w)({body})(?!\w)", re.IGNORECASE)

    def code_for(self, surface: str) -> str:
        hit = self.surface_to_code.get(surface)
        if hit:
            return hit
        lowered = surface.casefold()
        for known, code in self.surface_to_code.items():
            if known.casefold() == lowered:
                return code
        raise KeyError(surface)

    def __len__(self) -> int:
        return len(self.entries)


def repo_root() -> Path:
    try:
        out = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, check=True,
        )
        return Path(out.stdout.strip())
    except (subprocess.CalledProcessError, FileNotFoundError):
        return Path.cwd()


def load_mapping(path: Path) -> Mapping:
    if not path.exists():
        sys.exit(
            f"no mapping at {path}\n"
            f"copy {MAPPING_FILE}.example and fill in the clearnames "
            f"(the file is gitignored and stays local)."
        )

    entries: dict[str, list[str]] = {}
    for lineno, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            sys.exit(f"{path}:{lineno}: expected CODE=\"...\", got: {raw}")

        code, _, value = line.partition("=")
        code = code.strip()
        value = value.strip().strip('"').strip("'")

        surfaces = [s.strip() for s in value.split("|") if s.strip()]
        surfaces = [s for s in surfaces if not s.upper().startswith("TODO")]
        if not surfaces:
            continue  # a code awaiting its clearname — nothing to match yet
        entries[code] = surfaces

    if not entries:
        sys.exit(f"{path} holds no usable entries yet (all TODO?)")
    return Mapping(entries)


def is_texty(path: Path) -> bool:
    if path.suffix.lower() in SKIP_SUFFIXES:
        return False
    try:
        with path.open("rb") as fh:
            return b"\0" not in fh.read(8192)
    except OSError:
        return False


def walk(targets: list[Path], mapping_path: Path) -> list[Path]:
    found: list[Path] = []
    for target in targets:
        if target.is_file():
            if target.resolve() != mapping_path.resolve() and is_texty(target):
                found.append(target)
            continue
        for dirpath, dirnames, filenames in os.walk(target):
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
            for name in filenames:
                candidate = Path(dirpath) / name
                if candidate.resolve() == mapping_path.resolve():
                    continue
                if is_texty(candidate):
                    found.append(candidate)
    return found


def staged_files() -> list[str]:
    out = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
        capture_output=True, text=True, check=True,
    )
    return [line for line in out.stdout.splitlines() if line.strip()]


def staged_text(rel: str) -> str | None:
    """The content as it would be committed — not what sits in the worktree."""
    out = subprocess.run(
        ["git", "show", f":{rel}"], capture_output=True, check=False,
    )
    if out.returncode != 0 or b"\0" in out.stdout[:8192]:
        return None
    if Path(rel).suffix.lower() in SKIP_SUFFIXES:
        return None
    return out.stdout.decode("utf-8", errors="replace")


def scan(text: str, pattern: re.Pattern) -> list[tuple[int, str]]:
    hits: list[tuple[int, str]] = []
    for lineno, line in enumerate(text.splitlines(), 1):
        for match in pattern.finditer(line):
            hits.append((lineno, match.group(1)))
    return hits


def cmd_check(args, mapping: Mapping, mapping_path: Path) -> int:
    if mapping.clear_re is None:
        print("nothing to check — no clearnames in the mapping")
        return 0

    total = 0
    if args.staged:
        for rel in staged_files():
            text = staged_text(rel)
            if text is None:
                continue
            for lineno, surface in scan(text, mapping.clear_re):
                print(f"{rel}:{lineno}: clearname staged — {surface!r} "
                      f"→ should be {mapping.code_for(surface)}")
                total += 1
    else:
        for path in walk(args.paths, mapping_path):
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            for lineno, surface in scan(text, mapping.clear_re):
                print(f"{path}:{lineno}: clearname — {surface!r} "
                      f"→ should be {mapping.code_for(surface)}")
                total += 1

    if total:
        sys.stdout.flush()  # keep the summary below the hits when piped
        where = "staged content" if args.staged else "the scanned paths"
        print(f"\n{total} clearname occurrence(s) in {where}. "
              f"Run: scripts/pseudonyms.py anon <paths> --write", file=sys.stderr)
        return 1

    print("clean — no clearnames found")
    return 0


def replace(args, mapping: Mapping, mapping_path: Path, direction: str) -> int:
    if direction == "anon":
        pattern = mapping.clear_re
        substitute = lambda m: mapping.code_for(m.group(1))  # noqa: E731
    else:
        pattern = mapping.code_re
        substitute = lambda m: mapping.canonical_upper[m.group(1).upper()]  # noqa: E731

    if pattern is None:
        print("nothing to do — the mapping is empty in that direction")
        return 0

    changed_files = 0
    changed_hits = 0
    for path in walk(args.paths, mapping_path):
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue

        hits = scan(text, pattern)
        if not hits:
            continue

        for lineno, surface in hits:
            arrow = mapping.code_for(surface) if direction == "anon" \
                else mapping.canonical_upper[surface.upper()]
            print(f"{path}:{lineno}: {surface!r} → {arrow!r}")

        changed_files += 1
        changed_hits += len(hits)

        if args.write:
            path.write_text(pattern.sub(substitute, text), encoding="utf-8")

    verb = "rewrote" if args.write else "would rewrite"
    print(f"\n{verb} {changed_hits} occurrence(s) in {changed_files} file(s)")
    if not args.write and changed_hits:
        print("dry run — pass --write to apply", file=sys.stderr)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="pseudonyms.py", description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--mapping", default=None,
                        help=f"mapping file (default: <repo-root>/{MAPPING_FILE})")
    sub = parser.add_subparsers(dest="mode", required=True)

    check = sub.add_parser("check", help="exit 1 if a clearname is present")
    check.add_argument("paths", nargs="*", type=Path, default=[Path(".")])
    check.add_argument("--staged", action="store_true",
                       help="check staged content instead of the worktree")

    for name, helptext in (("anon", "clearname -> CODE"),
                           ("deanon", "CODE -> clearname")):
        p = sub.add_parser(name, help=helptext)
        p.add_argument("paths", nargs="*", type=Path, default=[Path(".")])
        p.add_argument("--write", action="store_true",
                       help="apply the changes (default: report only)")

    sub.add_parser("list", help="show the loaded codes (clearnames masked)")

    args = parser.parse_args()

    root = repo_root()
    mapping_path = Path(args.mapping) if args.mapping else root / MAPPING_FILE
    mapping = load_mapping(mapping_path)

    if args.mode == "list":
        print(f"{len(mapping)} code(s) from {mapping_path}:")
        for code, surfaces in sorted(mapping.entries.items()):
            masked = ", ".join(f"{s[0]}{'·' * (len(s) - 1)}" for s in surfaces)
            print(f"  {code:<12} {len(surfaces)} surface(s): {masked}")
        return 0

    if args.mode == "check":
        return cmd_check(args, mapping, mapping_path)
    return replace(args, mapping, mapping_path, args.mode)


if __name__ == "__main__":
    sys.exit(main())
