#!/usr/bin/env bash
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

matchers=(
  "superpoint+superglue"
  "xfeat(sparse)"
  "superpoint+lightglue"
  "loftr"
  "dkm"
  "minima(RoMa)"
  "RoMa"
)

for matcher in "${matchers[@]}"; do
    # Create safe directory name
    safe_matcher=$(printf '%s' "$matcher" | tr -d ' ' | tr '+()' '_')
    for split in inTraj outTraj; do
        echo "Running matcher: $matcher on $split"
        run_pipeline pipeline_matching.py \
            --num_iterations 3 \
            --dataset uavd4l --split "$split" \
            --uav_mode normal --lod_mode normal \
            --matcher_key "$matcher" \
            --out "outputs/ablation_matchers/${safe_matcher}_${split}" \
            "$@"
    done
done

echo "Done."
