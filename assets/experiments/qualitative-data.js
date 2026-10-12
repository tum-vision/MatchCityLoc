// Camera-ready paper/supplement panels and their measured annotations.
window.MATCHCITYLOC_PANEL_ERRORS = {
  "uav-in": {
    "gps": {
      "translation": 6.3,
      "rotation": 3.2
    },
    "v2": {
      "translation": 9.5,
      "rotation": 3.2
    },
    "v3": {
      "translation": 7.1,
      "rotation": 3.2
    },
    "sem": {
      "translation": 10.1,
      "rotation": 17.9
    },
    "mc": {
      "translation": 0.5,
      "rotation": 0.2
    }
  },
  "uav-out": {
    "gps": {
      "translation": 13.3,
      "rotation": 2.0
    },
    "v2": {
      "translation": 3.1,
      "rotation": 1.9
    },
    "v3": {
      "translation": 5.9,
      "rotation": 2.0
    },
    "sem": {
      "translation": 7.4,
      "rotation": 2.4
    },
    "mc": {
      "translation": 0.9,
      "rotation": 0.8
    }
  },
  "swiss-in": {
    "gps": {
      "translation": 24.7,
      "rotation": 4.9
    },
    "v2": {
      "translation": 3.9,
      "rotation": 1.2
    },
    "v3": {
      "translation": 3.2,
      "rotation": 1.2
    },
    "sem": {
      "translation": 3.3,
      "rotation": 1.3
    },
    "mc": {
      "translation": 1.9,
      "rotation": 0.9
    }
  },
  "swiss-out": {
    "gps": {
      "translation": 29.2,
      "rotation": 1.2
    },
    "v2": {
      "translation": 5.4,
      "rotation": 1.4
    },
    "v3": {
      "translation": 3.2,
      "rotation": 1.1
    },
    "sem": {
      "translation": 9.1,
      "rotation": 1.2
    },
    "mc": {
      "translation": 0.9,
      "rotation": 0.4
    }
  },
  "semcity": {
    "gps": {
      "translation": 16.1,
      "rotation": 3.7
    },
    "v2": {
      "translation": 11.9,
      "rotation": 3.9
    },
    "v3": {
      "translation": 11.6,
      "rotation": 1.6
    },
    "sem": {
      "translation": 10.6,
      "rotation": 3.0
    },
    "mc": {
      "translation": 0.7,
      "rotation": 0.4
    }
  },
  "swiss-construction": {
    "v2": {
      "translation": 5.8,
      "rotation": 3.4
    },
    "v3": {
      "translation": 1.5,
      "rotation": 0.9
    },
    "sem": {
      "translation": 0.6,
      "rotation": 0.3
    },
    "mc": {
      "translation": 0.4,
      "rotation": 1.3
    }
  },
  "semcity-facade": {
    "v2": {
      "translation": 9.0,
      "rotation": 6.93
    },
    "v3": {
      "translation": 33.1,
      "rotation": 24.0
    },
    "sem": {
      "translation": 27.2,
      "rotation": 12.5
    },
    "mc": {
      "translation": 0.53,
      "rotation": 7.55
    }
  },
  "failure-uav": {
    "mc": {
      "translation": 6.3,
      "rotation": 1.94
    }
  },
  "failure-semcity": {
    "mc": {
      "translation": 39.3,
      "rotation": 5.89
    }
  },
  "failure-swiss": {
    "mc": {
      "translation": 16.5,
      "rotation": 4.11
    }
  }
};
window.MATCHCITYLOC_EXTRA_SCENES = [
  {
    "id": "swiss-construction",
    "label": "Swiss-EPFL \u00b7 Construction mismatch",
    "group": "Challenging scenes",
    "methods": [
      "v2",
      "v3",
      "sem",
      "mc"
    ],
    "note": "Construction-site temporal mismatch, from the main paper. Four methods are available for this example."
  },
  {
    "id": "semcity-facade",
    "label": "SemCityLockeD \u00b7 Facade-dominated view",
    "group": "Challenging scenes",
    "methods": [
      "v2",
      "v3",
      "sem",
      "mc"
    ],
    "note": "Facade-dominated view, from the main paper. Four methods are available for this example."
  },
  {
    "id": "failure-uav",
    "label": "UAVD4L \u00b7 Repetitive geometry (failure)",
    "group": "Failure cases",
    "methods": [
      "mc",
      "gt"
    ],
    "note": "Supplementary failure case: repetitive structure and limited LoD context. Only MatchCityLoc and ground-truth panels are available; no baseline results are implied."
  },
  {
    "id": "failure-semcity",
    "label": "SemCityLockeD \u00b7 Similar buildings (failure)",
    "group": "Failure cases",
    "methods": [
      "mc",
      "gt"
    ],
    "note": "Supplementary failure case: confusion between similar buildings. Only MatchCityLoc and ground-truth panels are available; no baseline results are implied."
  },
  {
    "id": "failure-swiss",
    "label": "Swiss-EPFL \u00b7 Temporal mismatch (failure)",
    "group": "Failure cases",
    "methods": [
      "mc",
      "gt"
    ],
    "note": "Supplementary failure case: construction-site temporal mismatch. Only MatchCityLoc and ground-truth panels are available; no baseline results are implied."
  }
];
