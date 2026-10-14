// Exported from camera-ready paper/tables. Regenerate with tools/export_paper_tables.py.
window.MATCHCITYLOC_BENCHMARKS = [
  {
    "id": "uav",
    "label": "UAVD4L-LoDv2",
    "variants": [
      {
        "split": "in-Traj",
        "lod": "LoD3",
        "source": "Table 1",
        "rows": [
          {
            "method": "Sensor priors",
            "vision": "--",
            "setup": "--",
            "group": "prior",
            "map": "Sensor prior",
            "translation": 6.48,
            "rotation": 1.63,
            "r2": 0.0,
            "r3": 0.0,
            "r5": 4.3,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "UAVLoc",
            "vision": "LoFTR",
            "setup": "O",
            "group": "off",
            "map": "Textured mesh",
            "translation": 0.81,
            "rotation": 0.29,
            "r2": 84.98,
            "r3": 88.09,
            "r5": 88.9,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "second",
              "rotation": "second"
            },
            "note": ""
          },
          {
            "method": "UAVLoc",
            "vision": "RoMa",
            "setup": "O",
            "group": "off",
            "map": "Textured mesh",
            "translation": 0.78,
            "rotation": 0.25,
            "r2": 93.27,
            "r3": 93.7,
            "r5": 93.77,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "best",
              "rotation": "best"
            },
            "note": ""
          },
          {
            "method": "LoD-Loc",
            "vision": "Custom U-Net",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": 3.32,
            "rotation": 1.48,
            "r2": 49.56,
            "r3": 71.82,
            "r5": 89.09,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "LoD-Loc v2",
            "vision": "SAM2 + U-Net",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": 0.72,
            "rotation": 0.15,
            "r2": 93.7,
            "r3": 98.4,
            "r5": 99.5,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "second",
              "rotation": "second"
            },
            "note": ""
          },
          {
            "method": "LoD-Loc v3",
            "vision": "SAM-Prompter",
            "setup": "C*",
            "group": "trained",
            "map": "LoD",
            "translation": 0.49,
            "rotation": 0.13,
            "r2": 97.6,
            "r3": 98.9,
            "r5": 99.7,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "best",
              "rotation": "best"
            },
            "note": ""
          },
          {
            "method": "SemCityLoc\u2021",
            "vision": "DINOv3+DPT",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": 1.68,
            "rotation": 0.19,
            "r2": 70.45,
            "r3": 92.96,
            "r5": 99.19,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": "Reported by SemCityLoc under its source protocol; errors are mean translation and yaw, not median translation and full rotation."
          },
          {
            "method": "LoD-Loc v2\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 1.85,
            "rotation": 1.23,
            "r2": 57.2,
            "r3": 78.8,
            "r5": 92.8,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "second",
              "rotation": "second"
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "LoD-Loc v3\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 1.87,
            "rotation": 1.23,
            "r2": 54.5,
            "r3": 78.7,
            "r5": 90.6,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": "second"
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "SemCityLoc\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 0.68,
            "rotation": 0.38,
            "r2": 94.76,
            "r3": 99.56,
            "r5": 100.0,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "best",
              "rotation": "best"
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "MC-Loc",
            "vision": "DINOv2",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 8.29,
            "rotation": 2.58,
            "r2": 1.2,
            "r3": 4.1,
            "r5": 17.4,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "MC-Loc",
            "vision": "RoMa",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 10.6,
            "rotation": 8.6,
            "r2": 0.1,
            "r3": 0.6,
            "r5": 3.3,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "LoD-Loc v2\u2020",
            "vision": "SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 2.33,
            "rotation": 1.27,
            "r2": 35.7,
            "r3": 67.8,
            "r5": 81.5,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "SemCityLoc\u2020",
            "vision": "SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 1.67,
            "rotation": 0.81,
            "r2": 63.84,
            "r3": 88.03,
            "r5": 96.32,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "PlanarCityLoc",
            "vision": "MoGe-2 + SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 1.28,
            "rotation": 0.68,
            "r2": 75.4,
            "r3": 90.8,
            "r5": 97.2,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "second",
              "rotation": "second"
            },
            "note": "Reported full-pipeline results from PlanarCityLoc (WACV 2027), using MoGe-2 ViT-S and SAM3; not a new re-run."
          },
          {
            "method": "MatchCityLoc (Ours)",
            "vision": "MINIMA (RoMa)",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 0.62,
            "rotation": 0.34,
            "r2": 92.64,
            "r3": 96.13,
            "r5": 98.44,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "best",
              "rotation": "best"
            },
            "note": ""
          }
        ]
      },
      {
        "split": "out-of-Traj",
        "lod": "LoD3",
        "source": "Table 1",
        "rows": [
          {
            "method": "Sensor priors",
            "vision": "--",
            "setup": "--",
            "group": "prior",
            "map": "Sensor prior",
            "translation": 11.12,
            "rotation": 1.33,
            "r2": 0.0,
            "r3": 0.0,
            "r5": 0.36,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "UAVLoc",
            "vision": "LoFTR",
            "setup": "O",
            "group": "off",
            "map": "Textured mesh",
            "translation": 0.79,
            "rotation": 0.2,
            "r2": 91.56,
            "r3": 92.02,
            "r5": 92.11,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "second",
              "rotation": "best"
            },
            "note": ""
          },
          {
            "method": "UAVLoc",
            "vision": "RoMa",
            "setup": "O",
            "group": "off",
            "map": "Textured mesh",
            "translation": 0.73,
            "rotation": 0.22,
            "r2": 95.03,
            "r3": 95.53,
            "r5": 95.53,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "best",
              "rotation": "second"
            },
            "note": ""
          },
          {
            "method": "LoD-Loc",
            "vision": "Custom U-Net",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": 3.33,
            "rotation": 1.18,
            "r2": 54.2,
            "r3": 75.05,
            "r5": 89.51,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "LoD-Loc v2",
            "vision": "SAM2 + U-Net",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": 0.71,
            "rotation": 0.14,
            "r2": 97.9,
            "r3": 99.8,
            "r5": 100.0,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "second",
              "rotation": "second"
            },
            "note": ""
          },
          {
            "method": "LoD-Loc v3",
            "vision": "SAM-Prompter",
            "setup": "C*",
            "group": "trained",
            "map": "LoD",
            "translation": 0.6,
            "rotation": 0.12,
            "r2": 97.4,
            "r3": 99.0,
            "r5": 99.4,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "best",
              "rotation": "best"
            },
            "note": ""
          },
          {
            "method": "SemCityLoc\u2021",
            "vision": "DINOv3+DPT",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": 1.26,
            "rotation": 0.14,
            "r2": 89.64,
            "r3": 98.4,
            "r5": 99.95,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": "Reported by SemCityLoc under its source protocol; errors are mean translation and yaw, not median translation and full rotation."
          },
          {
            "method": "LoD-Loc v2\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 1.76,
            "rotation": 0.94,
            "r2": 64.9,
            "r3": 94.5,
            "r5": 98.3,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "best",
              "translation": "second",
              "rotation": "second"
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "LoD-Loc v3\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 2.15,
            "rotation": 0.95,
            "r2": 41.33,
            "r3": 83.76,
            "r5": 96.4,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "SemCityLoc\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 0.54,
            "rotation": 0.24,
            "r2": 92.2,
            "r3": 95.71,
            "r5": 97.22,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "second",
              "translation": "best",
              "rotation": "best"
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "MC-Loc",
            "vision": "DINOv2",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 7.02,
            "rotation": 2.29,
            "r2": 2.4,
            "r3": 7.4,
            "r5": 26.1,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "MC-Loc",
            "vision": "RoMa",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 16.9,
            "rotation": 3.88,
            "r2": 0.2,
            "r3": 0.9,
            "r5": 3.3,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "LoD-Loc v2\u2020",
            "vision": "SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 1.77,
            "rotation": 0.95,
            "r2": 64.3,
            "r3": 93.3,
            "r5": 98.2,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "SemCityLoc\u2020",
            "vision": "SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 1.49,
            "rotation": 0.62,
            "r2": 69.07,
            "r3": 87.45,
            "r5": 94.57,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": "second"
            },
            "note": ""
          },
          {
            "method": "PlanarCityLoc",
            "vision": "MoGe-2 + SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 1.26,
            "rotation": 0.69,
            "r2": 80.6,
            "r3": 95.1,
            "r5": 99.0,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "second",
              "rotation": null
            },
            "note": "Reported full-pipeline results from PlanarCityLoc (WACV 2027), using MoGe-2 ViT-S and SAM3; not a new re-run."
          },
          {
            "method": "MatchCityLoc (Ours)",
            "vision": "MINIMA (RoMa)",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 0.66,
            "rotation": 0.28,
            "r2": 94.66,
            "r3": 98.45,
            "r5": 99.22,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "best",
              "rotation": "best"
            },
            "note": ""
          }
        ]
      }
    ]
  },
  {
    "id": "swiss",
    "label": "Swiss-EPFLv2",
    "variants": [
      {
        "split": "in-Place",
        "lod": "LoD2",
        "source": "Table 1",
        "rows": [
          {
            "method": "Sensor priors",
            "vision": "--",
            "setup": "--",
            "group": "prior",
            "map": "Sensor prior",
            "translation": 17.59,
            "rotation": 3.86,
            "r2": 0.0,
            "r3": 0.0,
            "r5": 0.56,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "UAVLoc",
            "vision": "LoFTR",
            "setup": "O",
            "group": "off",
            "map": "Textured mesh",
            "translation": 3.06,
            "rotation": 1.86,
            "r2": 26.4,
            "r3": 46.21,
            "r5": 62.22,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "second",
              "rotation": "second"
            },
            "note": ""
          },
          {
            "method": "UAVLoc",
            "vision": "RoMa",
            "setup": "O",
            "group": "off",
            "map": "Textured mesh",
            "translation": 2.08,
            "rotation": 1.29,
            "r2": 45.95,
            "r3": 66.77,
            "r5": 80.73,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "best",
              "rotation": "best"
            },
            "note": ""
          },
          {
            "method": "LoD-Loc",
            "vision": "Custom U-Net",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": 2.87,
            "rotation": 1.78,
            "r2": 36.79,
            "r3": 50.56,
            "r5": 69.77,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "LoD-Loc v2",
            "vision": "SAM2 + U-Net",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": 1.83,
            "rotation": 0.85,
            "r2": 54.2,
            "r3": 74.6,
            "r5": 92.0,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "second",
              "rotation": "second"
            },
            "note": ""
          },
          {
            "method": "LoD-Loc v3",
            "vision": "SAM-Prompter",
            "setup": "C*",
            "group": "trained",
            "map": "LoD",
            "translation": 1.61,
            "rotation": 0.77,
            "r2": 58.6,
            "r3": 79.9,
            "r5": 95.4,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "best",
              "rotation": "best"
            },
            "note": ""
          },
          {
            "method": "SemCityLoc\u2021",
            "vision": "DINOv3+DPT",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": 7.13,
            "rotation": 1.31,
            "r2": 33.99,
            "r3": 50.7,
            "r5": 62.36,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": "Reported by SemCityLoc under its source protocol; errors are mean translation and yaw, not median translation and full rotation."
          },
          {
            "method": "LoD-Loc v2\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 1.36,
            "rotation": 0.85,
            "r2": 74.9,
            "r3": 90.6,
            "r5": 93.5,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "second",
              "rotation": "second"
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "LoD-Loc v3\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 1.79,
            "rotation": 0.91,
            "r2": 56.3,
            "r3": 72.2,
            "r5": 78.9,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "SemCityLoc\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 1.09,
            "rotation": 0.59,
            "r2": 70.51,
            "r3": 78.51,
            "r5": 83.99,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "best",
              "rotation": "best"
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "MC-Loc",
            "vision": "DINOv2",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 8.18,
            "rotation": 2.54,
            "r2": 0.9,
            "r3": 4.4,
            "r5": 17.5,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "MC-Loc",
            "vision": "RoMa",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 9.8,
            "rotation": 2.65,
            "r2": 0.2,
            "r3": 1.2,
            "r5": 4.8,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "LoD-Loc v2\u2020",
            "vision": "SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 6.51,
            "rotation": 1.83,
            "r2": 9.4,
            "r3": 19.9,
            "r5": 39.7,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": "second"
            },
            "note": ""
          },
          {
            "method": "SemCityLoc\u2020",
            "vision": "SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 47.5,
            "rotation": 10.1,
            "r2": 0.0,
            "r3": 0.0,
            "r5": 0.0,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "PlanarCityLoc",
            "vision": "MoGe-2 + SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 3.7,
            "rotation": 1.9,
            "r2": 20.6,
            "r3": 39.0,
            "r5": 59.7,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "second",
              "rotation": null
            },
            "note": "Reported full-pipeline results from PlanarCityLoc (WACV 2027), using MoGe-2 ViT-S and SAM3; not a new re-run."
          },
          {
            "method": "MatchCityLoc (Ours)",
            "vision": "MINIMA (RoMa)",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 1.43,
            "rotation": 1.02,
            "r2": 66.5,
            "r3": 86.3,
            "r5": 94.2,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "best",
              "rotation": "best"
            },
            "note": ""
          }
        ]
      },
      {
        "split": "out-of-Place",
        "lod": "LoD2",
        "source": "Table 1",
        "rows": [
          {
            "method": "Sensor priors",
            "vision": "--",
            "setup": "--",
            "group": "prior",
            "map": "Sensor prior",
            "translation": 17.88,
            "rotation": 3.94,
            "r2": 0.0,
            "r3": 0.0,
            "r5": 1.06,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "UAVLoc",
            "vision": "LoFTR",
            "setup": "O",
            "group": "off",
            "map": "Textured mesh",
            "translation": 1.12,
            "rotation": 1.08,
            "r2": 68.87,
            "r3": 81.0,
            "r5": 84.96,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "second",
              "rotation": "second"
            },
            "note": ""
          },
          {
            "method": "UAVLoc",
            "vision": "RoMa",
            "setup": "O",
            "group": "off",
            "map": "Textured mesh",
            "translation": 0.77,
            "rotation": 1.04,
            "r2": 89.18,
            "r3": 89.68,
            "r5": 98.84,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "best",
              "rotation": "best"
            },
            "note": ""
          },
          {
            "method": "LoD-Loc",
            "vision": "Custom U-Net",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": 8.73,
            "rotation": 2.78,
            "r2": 14.24,
            "r3": 31.39,
            "r5": 59.89,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "LoD-Loc v2",
            "vision": "SAM2 + U-Net",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": 2.64,
            "rotation": 0.73,
            "r2": 31.4,
            "r3": 58.53,
            "r5": 86.3,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "second",
              "rotation": "best"
            },
            "note": ""
          },
          {
            "method": "LoD-Loc v3",
            "vision": "SAM-Prompter",
            "setup": "C*",
            "group": "trained",
            "map": "LoD",
            "translation": 2.43,
            "rotation": 0.83,
            "r2": 36.9,
            "r3": 64.1,
            "r5": 88.9,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "best",
              "rotation": "second"
            },
            "note": ""
          },
          {
            "method": "SemCityLoc\u2021",
            "vision": "DINOv3+DPT",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": 3.09,
            "rotation": 0.93,
            "r2": 35.36,
            "r3": 62.01,
            "r5": 89.18,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": "Reported by SemCityLoc under its source protocol; errors are mean translation and yaw, not median translation and full rotation."
          },
          {
            "method": "LoD-Loc v2\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 2.15,
            "rotation": 0.78,
            "r2": 43.3,
            "r3": 75.2,
            "r5": 93.9,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "best",
              "translation": "second",
              "rotation": "second"
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "LoD-Loc v3\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 2.27,
            "rotation": 0.79,
            "r2": 40.1,
            "r3": 73.6,
            "r5": 93.9,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": "best",
              "translation": null,
              "rotation": null
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "SemCityLoc\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 0.9,
            "rotation": 0.29,
            "r2": 72.82,
            "r3": 79.42,
            "r5": 85.49,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "second",
              "translation": "best",
              "rotation": "best"
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "MC-Loc",
            "vision": "DINOv2",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 6.23,
            "rotation": 1.97,
            "r2": 2.9,
            "r3": 9.0,
            "r5": 30.2,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "MC-Loc",
            "vision": "RoMa",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 10.3,
            "rotation": 3.97,
            "r2": 0.7,
            "r3": 2.1,
            "r5": 11.5,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "LoD-Loc v2\u2020",
            "vision": "SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 3.9,
            "rotation": 1.33,
            "r2": 17.4,
            "r3": 33.0,
            "r5": 66.2,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "SemCityLoc\u2020",
            "vision": "SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 46.22,
            "rotation": 9.02,
            "r2": 0.0,
            "r3": 0.0,
            "r5": 0.0,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "PlanarCityLoc",
            "vision": "MoGe-2 + SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 1.98,
            "rotation": 1.21,
            "r2": 48.5,
            "r3": 72.3,
            "r5": 89.4,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "second",
              "rotation": "second"
            },
            "note": "Reported full-pipeline results from PlanarCityLoc (WACV 2027), using MoGe-2 ViT-S and SAM3; not a new re-run."
          },
          {
            "method": "MatchCityLoc (Ours)",
            "vision": "MINIMA (RoMa)",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 1.3,
            "rotation": 0.95,
            "r2": 69.3,
            "r3": 87.8,
            "r5": 96.1,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "best",
              "rotation": "best"
            },
            "note": ""
          }
        ]
      }
    ]
  },
  {
    "id": "semcity",
    "label": "SemCityLockeD",
    "variants": [
      {
        "split": "Full evaluation",
        "lod": "LoD2",
        "source": "Table 2",
        "rows": [
          {
            "method": "Sensor priors",
            "vision": "--",
            "setup": "--",
            "group": "prior",
            "map": "Sensor prior",
            "translation": 13.89,
            "rotation": 2.35,
            "r2": 0.0,
            "r3": 0.0,
            "r5": 0.0,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "LoD-Loc\u2021",
            "vision": "Custom U-Net",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": 9.89,
            "rotation": 1.78,
            "r2": 35.11,
            "r3": 47.87,
            "r5": 53.19,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": "Reported by SemCityLoc under its source protocol; errors are mean translation and yaw, not median translation and full rotation."
          },
          {
            "method": "SemCityLoc\u2021",
            "vision": "DINOv3+DPT",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": 2.62,
            "rotation": 0.42,
            "r2": 69.15,
            "r3": 84.04,
            "r5": 89.36,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": "Reported by SemCityLoc under its source protocol; errors are mean translation and yaw, not median translation and full rotation."
          },
          {
            "method": "LoD-Loc v2\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 0.17,
            "rotation": 0.1,
            "r2": 79.1,
            "r3": 79.4,
            "r5": 80.9,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": null,
              "translation": "best",
              "rotation": "best"
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "LoD-Loc v3\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 2.6,
            "rotation": 0.29,
            "r2": 33.9,
            "r3": 58.5,
            "r5": 86.0,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": "second",
              "translation": null,
              "rotation": "second"
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "SemCityLoc\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 0.52,
            "rotation": 0.42,
            "r2": 90.07,
            "r3": 93.49,
            "r5": 95.73,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "second",
              "rotation": null
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "MC-Loc\u2021",
            "vision": "DINOv2",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 10.71,
            "rotation": 5.9,
            "r2": 5.32,
            "r3": 8.51,
            "r5": 18.09,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": "Reported by SemCityLoc under its source protocol; errors are mean translation and yaw, not median translation and full rotation."
          },
          {
            "method": "MC-Loc\u2021",
            "vision": "RoMa",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 18.61,
            "rotation": 6.67,
            "r2": 0.0,
            "r3": 1.06,
            "r5": 3.19,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": "Reported by SemCityLoc under its source protocol; errors are mean translation and yaw, not median translation and full rotation."
          },
          {
            "method": "LoD-Loc v2\u2020",
            "vision": "SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 3.78,
            "rotation": 0.51,
            "r2": 37.9,
            "r3": 45.4,
            "r5": 54.4,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": "best"
            },
            "note": ""
          },
          {
            "method": "SemCityLoc\u2020",
            "vision": "SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 1.93,
            "rotation": 1.16,
            "r2": 49.73,
            "r3": 61.37,
            "r5": 72.47,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "second",
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "MatchCityLoc (Ours)",
            "vision": "MINIMA (RoMa)",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 1.45,
            "rotation": 1.14,
            "r2": 59.12,
            "r3": 68.41,
            "r5": 77.16,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "best",
              "rotation": "second"
            },
            "note": ""
          }
        ]
      },
      {
        "split": "Full evaluation",
        "lod": "LoD3",
        "source": "Table 2",
        "rows": [
          {
            "method": "Sensor priors",
            "vision": "--",
            "setup": "--",
            "group": "prior",
            "map": "Sensor prior",
            "translation": 13.89,
            "rotation": 2.35,
            "r2": 0.0,
            "r3": 0.0,
            "r5": 0.0,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "LoD-Loc\u2021",
            "vision": "Custom U-Net",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": null,
            "rotation": null,
            "r2": null,
            "r3": null,
            "r5": null,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": "Reported by SemCityLoc under its source protocol; errors are mean translation and yaw, not median translation and full rotation."
          },
          {
            "method": "SemCityLoc\u2021",
            "vision": "DINOv3+DPT",
            "setup": "I",
            "group": "trained",
            "map": "LoD",
            "translation": 2.48,
            "rotation": 0.5,
            "r2": 70.21,
            "r3": 75.53,
            "r5": 89.36,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": "Reported by SemCityLoc under its source protocol; errors are mean translation and yaw, not median translation and full rotation."
          },
          {
            "method": "LoD-Loc v2\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 0.17,
            "rotation": 0.11,
            "r2": 78.0,
            "r3": 78.8,
            "r5": 80.8,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": null,
              "translation": "best",
              "rotation": "best"
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "LoD-Loc v3\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 2.52,
            "rotation": 0.28,
            "r2": 34.5,
            "r3": 58.8,
            "r5": 86.7,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": "second",
              "translation": null,
              "rotation": "second"
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "SemCityLoc\u2020",
            "vision": "--",
            "setup": "GT",
            "group": "oracle",
            "map": "LoD",
            "translation": 0.5,
            "rotation": 0.41,
            "r2": 93.28,
            "r3": 94.34,
            "r5": 95.52,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "second",
              "rotation": null
            },
            "note": "Adapted oracle evaluation using masks rendered at the ground-truth pose, with the public nvdiffrast renderer."
          },
          {
            "method": "MC-Loc\u2021",
            "vision": "DINOv2",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": null,
            "rotation": null,
            "r2": null,
            "r3": null,
            "r5": null,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": "Reported by SemCityLoc under its source protocol; errors are mean translation and yaw, not median translation and full rotation."
          },
          {
            "method": "MC-Loc\u2021",
            "vision": "RoMa",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": null,
            "rotation": null,
            "r2": null,
            "r3": null,
            "r5": null,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": null
            },
            "note": "Reported by SemCityLoc under its source protocol; errors are mean translation and yaw, not median translation and full rotation."
          },
          {
            "method": "LoD-Loc v2\u2020",
            "vision": "SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 7.91,
            "rotation": 0.75,
            "r2": 30.4,
            "r3": 36.0,
            "r5": 42.7,
            "ranks": {
              "r2": null,
              "r3": null,
              "r5": null,
              "translation": null,
              "rotation": "best"
            },
            "note": ""
          },
          {
            "method": "SemCityLoc\u2020",
            "vision": "SAM3",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 1.84,
            "rotation": 1.2,
            "r2": 49.63,
            "r3": 60.73,
            "r5": 71.08,
            "ranks": {
              "r2": "second",
              "r3": "second",
              "r5": "second",
              "translation": "second",
              "rotation": null
            },
            "note": ""
          },
          {
            "method": "MatchCityLoc (Ours)",
            "vision": "MINIMA (RoMa)",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 0.87,
            "rotation": 0.81,
            "r2": 70.33,
            "r3": 79.94,
            "r5": 86.34,
            "ranks": {
              "r2": "best",
              "r3": "best",
              "r5": "best",
              "translation": "best",
              "rotation": "second"
            },
            "note": ""
          }
        ]
      },
      {
        "split": "Full evaluation",
        "lod": "LoD1",
        "source": "LoD sensitivity ablation",
        "rows": [
          {
            "method": "MatchCityLoc (Ours)",
            "vision": "MINIMA (RoMa)",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "translation": 7.0,
            "rotation": 3.26,
            "r2": 14.09,
            "r3": 26.04,
            "r5": 40.45,
            "ranks": {},
            "note": "LoD1 ablation; no baseline results reported."
          }
        ]
      },
      {
        "split": "Author-provided subset (188 queries)",
        "lod": "LoD2",
        "source": "Supplementary Table A3",
        "rows": [
          {
            "method": "MatchCityLoc (Ours)",
            "vision": "MINIMA (RoMa)",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "ranks": {},
            "note": "All 188 author-provided query IDs. Five refinement updates. Full-rotation errors, not yaw-only errors.",
            "r2": 57.45,
            "r3": 63.3,
            "r5": 72.34,
            "translation": 1.46,
            "rotation": 1.16
          }
        ]
      },
      {
        "split": "Author-provided subset (188 queries)",
        "lod": "LoD3",
        "source": "Supplementary Table A3",
        "rows": [
          {
            "method": "MatchCityLoc (Ours)",
            "vision": "MINIMA (RoMa)",
            "setup": "O",
            "group": "off",
            "map": "LoD",
            "ranks": {},
            "note": "All 188 author-provided query IDs. Five refinement updates. Full-rotation errors, not yaw-only errors.",
            "r2": 67.55,
            "r3": 76.6,
            "r5": 84.57,
            "translation": 1.0,
            "rotation": 0.88
          }
        ]
      }
    ]
  }
];
