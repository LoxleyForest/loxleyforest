#!/usr/bin/env bash
# One-time setup for the logo scripts: fonts, a Python venv for outlining, node packages.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p fonts out
G=https://github.com/google/fonts/raw/main/ofl
curl -sSL -o fonts/CormorantSC-600.ttf "$G/cormorantsc/CormorantSC-SemiBold.ttf"
curl -sSL -o fonts/Montserrat.ttf "$G/montserrat/Montserrat%5Bwght%5D.ttf"
python3 -m venv venv
venv/bin/pip install -q fonttools uharfbuzz
venv/bin/python - <<'EOF'
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
f = TTFont('fonts/Montserrat.ttf'); instancer.instantiateVariableFont(f, {"wght": 500}, inplace=True); f.save('fonts/Montserrat-500.ttf')
EOF
npm install --no-audit --no-fund
echo "ready"
