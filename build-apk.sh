#!/usr/bin/env bash
# Andromeda launcher - pull + build APK (macOS / Linux / CI)
#   ./build-apk.sh            pull latest + debug APK
#   ./build-apk.sh release    pull latest + release APK (signed if keystore.properties exists)
#   ./build-apk.sh install    debug APK + adb install to a connected device
#   ./build-apk.sh nopull     skip the git pull
#   ./build-apk.sh clean      clean + debug build
set -euo pipefail
cd "$(dirname "$0")"

MODE="${1:-debug}"
PULL=1
TASK="assembleDebug"
VARIANT="debug"

case "$MODE" in
  debug|install) TASK="assembleDebug" ;;
  release) TASK="assembleRelease"; VARIANT="release" ;;
  clean) TASK="clean assembleDebug" ;;
  nopull) PULL=0 ;;
  *) echo "unknown option '$MODE' (debug|release|install|nopull|clean)"; exit 2 ;;
esac

echo
echo "=== Andromeda build [$VARIANT] ================================"
echo

if [ "$PULL" = 1 ]; then
  if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "[1/3] git pull --ff-only ..."
    git pull --ff-only || { echo "[error] pull failed (local changes/diverged). Try: git stash && git pull --ff-only — or ./build-apk.sh nopull"; exit 1; }
  else
    echo "[warn] not a git clone - skipping pull."
  fi
else
  echo "[1/3] skipping git pull (requested)"
fi

if ! command -v java >/dev/null 2>&1; then
  echo "[error] java not found - install a JDK 17+ (or Android Studio) first."; exit 1
fi

echo "[2/3] ./gradlew $TASK"
echo
./gradlew --console=plain $TASK

echo
echo "[3/3] collecting APK ..."
APK="app/build/outputs/apk/$VARIANT/app-$VARIANT.apk"
[ -f "$APK" ] || { echo "[error] build succeeded but $APK is missing"; exit 1; }

VER=$(grep -oE 'versionName = "[^"]+"' app/build.gradle.kts | head -1 | sed 's/.*"\(.*\)"/\1/')
[ -n "$VER" ] || VER="dev"

mkdir -p apk
OUT="apk/Andromeda-$VER-$VARIANT.apk"
cp -f "$APK" "$OUT"

echo
echo "=== OK ========================================================"
echo "  APK   : $OUT"
echo "  size  : $(du -h "$OUT" | cut -f1)"
echo
if [ "$VARIANT" = release ] && [ ! -f keystore.properties ]; then
  echo "  note  : release is UNSIGNED (no keystore.properties) - it will NOT"
  echo "          install. See README 'Release signing', or use: ./build-apk.sh"
  echo
fi
echo "  to set as your launcher: install the APK, press Home,"
echo "  choose Andromeda, then 'Always'."

if [ "$MODE" = install ]; then
  ADB="$(command -v adb || true)"
  if [ -z "$ADB" ] && [ -x "$HOME/Android/Sdk/platform-tools/adb" ]; then
    ADB="$HOME/Android/Sdk/platform-tools/adb"
  elif [ -z "$ADB" ] && [ -x "$HOME/Library/Android/sdk/platform-tools/adb" ]; then
    ADB="$HOME/Library/Android/sdk/platform-tools/adb"
  fi
  if [ -z "$ADB" ]; then
    echo "[warn] adb not found - APK still built: $OUT"
  else
    echo
    echo "[install] $ADB install -r $OUT"
    "$ADB" install -r "$OUT" || echo "[warn] install failed - device connected?"
  fi
fi
