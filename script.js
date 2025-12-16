const form = document.getElementById("uploadForm");
const loading = document.getElementById("loading");
const resultsDiv = document.getElementById("results");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = document.getElementById("pdfFile").files[0];
  if (!file) return;

  loading.classList.remove("hidden");
  resultsDiv.innerHTML = "";

  const formData = new FormData();
  formData.append("pdf", file);

  try {
    const response = await fetch("/.netlify/functions/analyze", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    displayResults(data);
  } catch (err) {
    resultsDiv.innerHTML = "<p class='text-red-600'>Error analyzing file.</p>";
  }

  loading.classList.add("hidden");
});

function displayResults(data) {
  if (!data.subjects) {
    resultsDiv.innerHTML = "<p>No results detected.</p>";
    return;
  }

  resultsDiv.innerHTML = `
    <h2 class="text-xl font-bold mb-4">Results Breakdown</h2>
    ${Object.entries(data.subjects)
      .map(
        ([subject, level]) => `
        <div class="border rounded p-4 mb-3">
          <h3 class="font-semibold">${subject}</h3>
          <p class="text-sm text-gray-600">
            ${explainLevel(level)}
          </p>
        </div>
      `
      )
      .join("")}
  `;
}

function explainLevel(level) {
  const map = {
    E: "Exceeding Expectations – Strong mastery of concepts.",
    M: "Meeting Expectations – Good understanding of grade-level work.",
    A: "Approaching Expectations – Needs some reinforcement.",
    B: "Below Expectations – Requires additional support."
  };
  return map[level] || "Performance level not recognized.";
}
