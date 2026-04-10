#!/bin/bash
# Render all video variants. Pass --hooks-only to skip intro variants.
# Usage: ./scripts/render-all-variants.sh [--hooks-only]

set -e
HOOKS_ONLY=false
[[ "$1" == "--hooks-only" ]] && HOOKS_ONLY=true

OUT="out"
mkdir -p "$OUT"

render() {
  local id="$1"
  local file="$2"
  echo "==> Rendering $id → $OUT/$file"
  npx remotion render "$id" "$OUT/$file" --log=error
}

# ParkingLleno
render "ParkingLleno" "parking-lleno.mp4"
render "ParkingLleno-A2" "parking-lleno-a2.mp4"
render "ParkingLleno-A3" "parking-lleno-a3.mp4"

# Natura2000Clip
render "Natura2000Clip" "natura2000-clip.mp4"
render "Natura2000Clip-N2" "natura2000-clip-n2.mp4"

# LaMulta
render "LaMulta" "la-multa.mp4"
render "LaMulta-C2" "la-multa-c2.mp4"
render "LaMulta-C3" "la-multa-c3.mp4"

# OchentaYSiete
render "OchentaYSiete" "ochenta-y-siete.mp4"
render "OchentaYSiete-B2" "ochenta-y-siete-b2.mp4"
render "OchentaYSiete-B3" "ochenta-y-siete-b3.mp4"

# ElPipeline
render "ElPipeline" "el-pipeline.mp4"
render "ElPipeline-D2" "el-pipeline-d2.mp4"
render "ElPipeline-D3" "el-pipeline-d3.mp4"

if [ "$HOOKS_ONLY" = false ]; then
  echo ""
  echo "==> Rendering intro variants..."

  render "ParkingLleno-Intro" "parking-lleno-intro.mp4"
  render "ParkingLleno-A2-Intro" "parking-lleno-a2-intro.mp4"
  render "ParkingLleno-A3-Intro" "parking-lleno-a3-intro.mp4"

  render "Natura2000Clip-Intro" "natura2000-clip-intro.mp4"
  render "Natura2000Clip-N2-Intro" "natura2000-clip-n2-intro.mp4"

  render "LaMulta-Intro" "la-multa-intro.mp4"
  render "LaMulta-C2-Intro" "la-multa-c2-intro.mp4"
  render "LaMulta-C3-Intro" "la-multa-c3-intro.mp4"

  render "OchentaYSiete-Intro" "ochenta-y-siete-intro.mp4"
  render "OchentaYSiete-B2-Intro" "ochenta-y-siete-b2-intro.mp4"
  render "OchentaYSiete-B3-Intro" "ochenta-y-siete-b3-intro.mp4"

  render "ElPipeline-Intro" "el-pipeline-intro.mp4"
  render "ElPipeline-D2-Intro" "el-pipeline-d2-intro.mp4"
  render "ElPipeline-D3-Intro" "el-pipeline-d3-intro.mp4"
fi

echo ""
echo "Done! $(ls -1 $OUT/*.mp4 | wc -l) videos rendered in $OUT/"
