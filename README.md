# ClinicLM Sandbox

ClinicLM Sandbox is a privacy-safe clinical support demo built to show how I think about ML-flavored systems when the real domain would otherwise involve sensitive data.

Everything in the repo is synthetic. The app runs entirely in the browser, the case library is fabricated for demonstration, and the evaluator checks behavior against bundled synthetic test cases.

## What It Demonstrates

- turning a domain-heavy idea into a public-safe software project
- reasoning over both text summaries and structured vitals
- retrieval-style matching against a case library
- transparent output with visible rationale
- a small evaluation loop instead of purely cosmetic AI output

## Why I Built It

I wanted a project that captured the product and evaluation side of decision-support work without depending on private data, private infrastructure, or a backend that would make the repo harder to present cleanly.

## Project Structure

- `index.html`: browser-based demo
- `styles.css`: interface styling
- `script.js`: browser-side reasoning logic
- `data/synthetic_cases.json`: synthetic case library
- `data/evaluation_cases.json`: synthetic evaluation set
- `evaluate_cases.py`: evaluator script

## What The Project Contains

- a browser-based decision-support demo
- a synthetic case library
- a synthetic evaluation set
- a small evaluator for checking urgency predictions

## How The Demo Works

- urgency is first driven by explicit red flags and vital-sign thresholds
- similar synthetic cases are then ranked using a simple token-overlap score
- the UI shows the recommendation, rationale, next actions, and nearest matches

## Safety Notes

- This is not medical advice.
- The repo uses synthetic data only.
- The goal is to show engineering judgment, transparency, and evaluation discipline.
