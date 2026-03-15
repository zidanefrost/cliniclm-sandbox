from __future__ import annotations

import json
from pathlib import Path


def load_json(path: str) -> list[dict]:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def tokenize(text: str) -> set[str]:
    tokens = []
    for raw_token in text.lower().replace(",", " ").replace(".", " ").split():
        token = raw_token.strip()
        if token:
            tokens.append(token)
    return set(tokens)


def closest_case(case: dict, library: list[dict]) -> dict:
    case_tokens = tokenize(case["summary"])
    scored = []
    for item in library:
      item_tokens = tokenize(item["summary"]) | set(item.get("keywords", []))
      overlap = len(case_tokens & item_tokens)
      vitals_gap = abs(case["temperatureC"] - item["temperatureC"]) + abs(case["oxygenSat"] - item["oxygenSat"])
      score = overlap * 10 - vitals_gap
      scored.append((score, item))
    scored.sort(key=lambda entry: entry[0], reverse=True)
    return scored[0][1]


def predict_urgency(case: dict, library: list[dict]) -> str:
    red_flags = set(case.get("redFlags", []))
    if "chest_pain" in red_flags or "confusion" in red_flags or "low_oxygen" in red_flags:
        return "urgent"
    if case["oxygenSat"] <= 93 or case["temperatureC"] >= 38.5 or case["heartRate"] >= 110:
        return "urgent"
    if case["systolicBp"] <= 100 or "dehydration" in case["summary"].lower() or "vomiting" in case["summary"].lower():
        return "same_day"
    return closest_case(case, library)["urgency"]


def main() -> int:
    library = load_json("data/synthetic_cases.json")
    evaluation_cases = load_json("data/evaluation_cases.json")
    correct = 0

    for index, case in enumerate(evaluation_cases, start=1):
        prediction = predict_urgency(case, library)
        is_correct = prediction == case["expectedUrgency"]
        correct += int(is_correct)
        print(
            f"Case {index}: expected={case['expectedUrgency']} predicted={prediction} match={is_correct}"
        )

    total = len(evaluation_cases)
    accuracy = round((correct / total) * 100, 2) if total else 0
    print(f"Accuracy: {accuracy}% ({correct}/{total})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
