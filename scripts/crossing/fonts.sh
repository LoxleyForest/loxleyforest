#!/bin/sh
# The caption faces, from Google Fonts (SIL Open Font License); not committed.
set -e
cd "$(dirname "$0")" && mkdir -p fonts out
get() { u=$(curl -s -A "Mozilla/4.0" "https://fonts.googleapis.com/css2?family=$1&display=swap" | grep -o "https://[^)]*" | head -1); curl -s "$u" -o "fonts/$2"; }
get "Cormorant+Garamond:ital,wght@1,300" CormorantGaramond-LightItalic.ttf
get "Cormorant+Garamond:wght@300" CormorantGaramond-Light.ttf
get "Montserrat:wght@500" Montserrat-500.ttf
get "Montserrat:wght@600" Montserrat-600.ttf
