#!/usr/bin/env bash
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/_common.sh"

# Group 2: superpoint+lightglue (x2), loftr (x2)
combos=(
  "superpoint+lightglue inTraj"
  "superpoint+lightglue outTraj"
  "loftr inTraj"
  "loftr outTraj"
)

for combo in "${combos[@]}"; do
    matcher=$(echo "$combo" | cut -d' ' -f1)
    split=$(echo "$combo" | cut -d' ' -f2)
    safe_matcher=$(echo "$matcher" | tr -d ' ' | tr '+()' '_')
    echo "Running matcher: $matcher on $split"
    run_pipeline pipeline_matching.py \
        --num_iterations 3 \
        --dataset uavd4l --split "$split" \
        --uav_mode normal --lod_mode normal \
        --matcher_key "$matcher" \
        --out "outputs/ablation_matchers/${safe_matcher}_${split}" \
        "$@"
done

echo "Group 2 done."
