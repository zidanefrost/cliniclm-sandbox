let syntheticCases = [];

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function scoreUrgency(input) {
  const redFlags = new Set(input.redFlags);
  if (redFlags.has("chest_pain") || redFlags.has("confusion") || redFlags.has("low_oxygen")) {
    return { urgency: "urgent", rationale: "A selected red-flag symptom triggered urgent escalation." };
  }
  if (input.oxygenSat <= 93 || input.temperatureC >= 38.5 || input.heartRate >= 110) {
    return { urgency: "urgent", rationale: "A vital-sign threshold crossed the urgent review boundary." };
  }
  if (input.systolicBp <= 100 || /vomiting|dehydration/.test(input.summary.toLowerCase())) {
    return { urgency: "same_day", rationale: "The case suggests dehydration or an unstable same-day review need." };
  }
  return { urgency: "routine", rationale: "No urgent trigger fired, so the case defaults to routine review." };
}

function retrieveMatches(input) {
  const inputTokens = new Set(tokenize(input.summary));
  const scored = syntheticCases.map((candidate) => {
    const candidateTokens = new Set([...tokenize(candidate.summary), ...(candidate.keywords || [])]);
    const overlap = [...inputTokens].filter((token) => candidateTokens.has(token)).length;
    const vitalsGap =
      Math.abs(input.temperatureC - candidate.temperatureC) +
      Math.abs(input.oxygenSat - candidate.oxygenSat) +
      Math.abs(input.heartRate - candidate.heartRate) / 10;
    const score = overlap * 10 - vitalsGap;
    return { candidate, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
}

function suggestedActions(baseUrgency, matches) {
  const actionSet = new Set();
  matches.forEach((match) => {
    (match.candidate.suggestedActions || []).forEach((action) => actionSet.add(action));
  });

  if (baseUrgency === "urgent") {
    actionSet.add("Escalate to urgent clinical review.");
  } else if (baseUrgency === "same_day") {
    actionSet.add("Book same-day review and repeat vital observations.");
  } else {
    actionSet.add("Provide clear safety-net advice and monitor symptoms.");
  }

  return [...actionSet].slice(0, 4);
}

function renderResult(input) {
  const urgencyResult = scoreUrgency(input);
  const matches = retrieveMatches(input);
  const label = document.getElementById("urgency-label");
  label.textContent = urgencyResult.urgency.replace("_", " ").toUpperCase();
  label.className = urgencyResult.urgency;
  document.getElementById("rationale-text").textContent = urgencyResult.rationale;

  const actions = suggestedActions(urgencyResult.urgency, matches);
  document.getElementById("action-list").innerHTML = actions.map((action) => `<li>${action}</li>`).join("");
  document.getElementById("match-list").innerHTML = matches
    .map(
      ({ candidate, score }) => `
        <article class="match-card">
          <strong>${candidate.id}</strong>
          <p>${candidate.summary}</p>
          <p>Urgency: ${candidate.urgency.toUpperCase()} | Similarity score: ${score.toFixed(1)}</p>
        </article>
      `
    )
    .join("");
}

function collectInput() {
  return {
    summary: document.getElementById("summary").value.trim(),
    temperatureC: Number(document.getElementById("temperature").value),
    systolicBp: Number(document.getElementById("systolic").value),
    heartRate: Number(document.getElementById("heart-rate").value),
    oxygenSat: Number(document.getElementById("oxygen").value),
    redFlags: [...document.querySelectorAll(".flag-row input:checked")].map((input) => input.value)
  };
}

function loadDemoCase() {
  document.getElementById("summary").value = "Adult with fever, cough, and shortness of breath. Oxygen saturation has dropped.";
  document.getElementById("temperature").value = "38.6";
  document.getElementById("systolic").value = "111";
  document.getElementById("heart-rate").value = "105";
  document.getElementById("oxygen").value = "92";
  document.querySelectorAll(".flag-row input").forEach((input) => {
    input.checked = input.value === "low_oxygen";
  });
}

async function init() {
  const response = await fetch("./data/synthetic_cases.json");
  syntheticCases = await response.json();

  document.getElementById("case-form").addEventListener("submit", (event) => {
    event.preventDefault();
    renderResult(collectInput());
  });

  document.getElementById("load-demo").addEventListener("click", () => {
    loadDemoCase();
    renderResult(collectInput());
  });
}

init().catch((error) => {
  document.getElementById("rationale-text").textContent = `Could not load synthetic cases: ${error}`;
});
