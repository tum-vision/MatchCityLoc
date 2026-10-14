"""Run with: python -m unittest discover -s scripts -p test_evaluate_subset.py"""
import unittest
from evaluate_subset import evaluate, query_ids


def row(name, t, r):
    return dict(frame=name, pnp_best_overall_t_err=t, pnp_best_overall_r_err=r,
                gps_prior_t_err=10, gps_prior_r_err=10)


class SubsetTests(unittest.TestCase):
    def test_exact_ids_and_strict_joint_thresholds(self):
        rows = [row("a", 1, 1), row("b", 1, 2), row("c", 9, 9), row("d", 0, 0)]
        out = evaluate(rows, ["c", "a", "b"])
        self.assertEqual(out["subset"]["joint_success_counts"], {"2": 1, "3": 2, "5": 2})
        self.assertEqual(out["subset"]["query_count"], 3)
        self.assertEqual(out["full_evaluation"]["query_count"], 4)
        self.assertEqual(out["subset"]["median_translation_m"], 1)

    def test_missing_query_rejected(self):
        with self.assertRaises(ValueError):
            evaluate([row("a", 1, 1)], ["b"])

    def test_duplicate_metrics_rejected(self):
        with self.assertRaises(ValueError):
            evaluate([row("a", 1, 1), row("a", 2, 2)], ["a"])

    def test_bad_manifest_rejected(self):
        for ids in ([], ["a", "a"], [1], [""]):
            with self.assertRaises(ValueError):
                query_ids({"val": {"inTraj": ids}}, "val", "inTraj")

    def test_invalid_error_never_silently_dropped(self):
        for error in (float("nan"), float("inf"), -1, True):
            with self.assertRaises(ValueError):
                evaluate([row("a", error, 1)], ["a"])


if __name__ == "__main__":
    unittest.main()
