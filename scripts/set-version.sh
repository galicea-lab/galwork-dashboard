#!/usr/bin/env bash
# ustawienie wersji aplikacji jednocześnie w package.json
# ("version") i src/configs/config.ts (domyślne app_version, gdy nie ustawiono
# NEXT_PUBLIC_APP_VERSION).
#
#   scripts/set-version.sh                 # pokaż obie wersje
#   scripts/set-version.sh 0.1.5           # ustaw wersję
#   scripts/set-version.sh patch|minor|major   # podbij wersję z package.json
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKG="$ROOT/package.json"
CFG="$ROOT/src/configs/config.ts"
CFG_RE="(app_version: process\.env\.NEXT_PUBLIC_APP_VERSION \|\| ')([^']*)(')"

pkg_version() { node -p "require(process.argv[1]).version" "$PKG"; }
cfg_version() { sed -nE "s/.*${CFG_RE}.*/\2/p" "$CFG" | head -n1; }

current_pkg="$(pkg_version)"
current_cfg="$(cfg_version)"
if [[ -z "$current_cfg" ]]; then
  echo "Nie znaleziono app_version w $CFG (oczekiwano: app_version: process.env.NEXT_PUBLIC_APP_VERSION || '...')" >&2
  exit 1
fi

if [[ $# -eq 0 ]]; then
  echo "package.json:          $current_pkg"
  echo "src/configs/config.ts: $current_cfg"
  [[ "$current_pkg" == "$current_cfg" ]] || echo "UWAGA: wersje się różnią" >&2
  exit 0
fi

arg="$1"
case "$arg" in
  patch|minor|major)
    if [[ ! "$current_pkg" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
      echo "Wersja w package.json ($current_pkg) nie jest w postaci X.Y.Z - podaj wersję jawnie" >&2
      exit 1
    fi
    major="${BASH_REMATCH[1]}"; minor="${BASH_REMATCH[2]}"; patch="${BASH_REMATCH[3]}"
    case "$arg" in
      patch) new="$major.$minor.$((patch + 1))" ;;
      minor) new="$major.$((minor + 1)).0" ;;
      major) new="$((major + 1)).0.0" ;;
    esac
    ;;
  *)
    new="$arg"
    ;;
esac

if [[ ! "$new" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
  echo "Niepoprawna wersja: $new (oczekiwano X.Y.Z albo X.Y.Z-etykieta)" >&2
  exit 1
fi

# package.json - przez node, żeby nie naruszyć reszty pliku (wcięcie 2 spacje)
node -e '
  const fs = require("fs");
  const [file, version] = process.argv.slice(1);
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  pkg.version = version;
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
' "$PKG" "$new"

sed -i -E "s/${CFG_RE}/\1${new}\3/" "$CFG"

if [[ "$(pkg_version)" != "$new" || "$(cfg_version)" != "$new" ]]; then
  echo "Nie udało się ustawić wersji $new w obu plikach" >&2
  exit 1
fi
echo "Wersja: $current_pkg -> $new (package.json, src/configs/config.ts)"
