"""Small eval helpers shared by the matching pipeline (no planar solver)."""
from __future__ import annotations

import numpy as np


def _safe_metrics(lst):
    return [x for x in lst if x is not None and not np.isnan(x)]


def _recall_pct(te_list, thresh_m: float) -> float:
    vals = _safe_metrics(te_list)
    if not vals:
        return float('nan')
    return 100.0 * sum(t < thresh_m for t in vals) / len(vals)
