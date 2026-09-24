#!/usr/bin/env bash
# Checks the logged-out landing screen on a connected Android device for the
# "page is dead" bug seen on the Galaxy A55.
#
# Usage: open the app on the landing screen (logged out), then run
#   ./scripts/repro-auth-sheet-tap.sh
#
# Steps:
#   1. Tap "Começar" / "Entrar" and check that the auth sheet actually opens.
#   2. Inside the sheet, tap the login button with a small finger drift
#      (`input swipe`), which a sheet content pan would swallow.
# RN logs from the run are saved to ./auth-sheet-logcat.txt.
#
# Low-end-device approximation (the original bug is timing-dependent, so this
# raises the odds rather than guaranteeing it):
#   - emulator: API 34 image started with `-cores 2`
#   - any device: adb shell wm density 480; adb shell settings put system font_scale 1.3
#     (undo: adb shell wm density reset; adb shell settings put system font_scale 1.0)
set -uo pipefail

DRIFT_DP=16
failed=0

dump() {
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null
  adb shell cat /sdcard/ui.xml | tr '>' '\n'
}

# Prints "x y" for the center of the first node matching the given attribute.
center_of() {
  local bounds
  bounds=$(dump | grep -F "$1" | head -1 | sed -E 's/.*bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]".*/\1 \2 \3 \4/')
  [ -n "$bounds" ] || return 1
  read -r x1 y1 x2 y2 <<<"$bounds"
  echo "$(((x1 + x2) / 2)) $(((y1 + y2) / 2))"
}

close_sheet() {
  local pos
  pos=$(center_of 'content-desc="Fechar folha de login"') || return 0
  adb shell input tap $pos
  sleep 1.5
}

# $1: landing button text, $2: text that only exists once the sheet is open
check_opens() {
  local pos
  if ! pos=$(center_of "text=\"$1\""); then
    echo "  '$1' not found — is the app on the landing screen?"
    failed=1
    return
  fi
  adb shell input tap $pos
  sleep 2
  if dump | grep -qF "$2"; then
    echo "  '$1' opens the sheet  ✔"
    close_sheet
  else
    echo "  '$1' did nothing       ✘  (landing screen is dead)"
    failed=1
  fi
}

adb logcat -c
density=$(adb shell wm density | tail -1 | grep -oE '[0-9]+$')
echo "device: $(adb shell getprop ro.product.model) / Android $(adb shell getprop ro.build.version.release), ${density}dpi"

echo "1. landing buttons"
check_opens "Começar" "Crie sua conta"
check_opens "Entrar" "Bem-vindo de volta"

echo "2. login button with ${DRIFT_DP}dp finger drift"
if pos=$(center_of 'text="Entrar"'); then
  adb shell input tap $pos
  sleep 2
fi
if read -r x y < <(center_of 'content-desc="Entrar com email e senha"'); then
  # Empty fields: a press that lands shows the "preencha email e senha" alert.
  adb shell input swipe "$x" "$y" "$x" "$((y + DRIFT_DP * density / 160))" 150
  sleep 1
  if dump | grep -qF 'preencha email e senha'; then
    echo "  press registered       ✔"
    ok=$(center_of 'text="OK"') && adb shell input tap $ok
  else
    echo "  press swallowed        ✘"
    failed=1
  fi
else
  echo "  sheet not open, skipped"
fi

adb logcat -d -s ReactNativeJS:V ReactNative:V AndroidRuntime:E >auth-sheet-logcat.txt
echo "logs: auth-sheet-logcat.txt"
[ "$failed" -eq 0 ] && echo "RESULT: OK" || echo "RESULT: FAILED"
exit "$failed"
