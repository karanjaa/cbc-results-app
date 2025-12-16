const pdf = require("pdf-parse");

const gradeValues = { E: 90, M: 70, A: 50, B: 25 };

const allSubjects = [
  "English",
  "Kiswahili",
  "Mathematics",
  "Integrated Science",
  "Science",
  "Health Education",
  "Pre-Technical Studies",
  "Social Studies",
  "Religious Education",
  "Creative Arts",
  "Agriculture"
];

function analyzePerformance(subjects) {
  const analysis = {
    totalSubjects: Object.keys(subjects).length,
    gradeBreakdown: { E: 0, M: 0, A: 0, B: 0 },
    averageScore: 0,
    strengths: [],
    needsImprovement: [],
    recommendedPathways: [],
    overallPerformance: "",
    recommendations: []
  };

  let totalScore = 0;

  Object.entries(subjects).forEach(([subject, grade]) => {
    analysis.gradeBreakdown[grade]++;
    totalScore += gradeValues[grade];

    if (grade === 'E' || grade === 'M') {
      analysis.strengths.push({ subject, grade });
    }
    if (grade === 'A' || grade === 'B') {
      analysis.needsImprovement.push({ subject, grade });
    }
  });

  analysis.averageScore = Math.round(totalScore / analysis.totalSubjects);

  if (analysis.averageScore >= 80) {
    analysis.overallPerformance = "Excellent";
  } else if (analysis.averageScore >= 65) {
    analysis.overallPerformance = "Good";
  } else if (analysis.averageScore >= 50) {
    analysis.overallPerformance = "Fair";
  } else {
    analysis.overallPerformance = "Needs Support";
  }

  const mathGrade = subjects["Mathematics"] || subjects["Maths"];
  const scienceGrade = subjects["Integrated Science"] || subjects["Science"];
  const englishGrade = subjects["English"];
  const kiswahiliGrade = subjects["Kiswahili"];
  const socialGrade = subjects["Social Studies"];
  const techGrade = subjects["Pre-Technical Studies"];
  const artsGrade = subjects["Creative Arts"];

  if ((mathGrade === 'E' || mathGrade === 'M') && (scienceGrade === 'E' || scienceGrade === 'M')) {
    analysis.recommendedPathways.push("STEM (Science, Technology, Engineering, Mathematics)");
  }

  if ((englishGrade === 'E' || englishGrade === 'M') && (socialGrade === 'E' || socialGrade === 'M')) {
    analysis.recommendedPathways.push("Social Sciences & Humanities");
  }

  if (techGrade === 'E' || techGrade === 'M') {
    analysis.recommendedPathways.push("Technical & Applied Sciences");
  }

  if (artsGrade === 'E' || artsGrade === 'M') {
    analysis.recommendedPathways.push("Arts, Sports & Creative Industries");
  }

  if ((mathGrade === 'E' || mathGrade === 'M') && (englishGrade === 'E' || englishGrade === 'M')) {
    analysis.recommendedPathways.push("Business & Entrepreneurship");
  }

  if (analysis.needsImprovement.length > 0) {
    analysis.recommendations.push({
      type: "immediate",
      message: `Focus on improving ${analysis.needsImprovement.length} subject(s) that need attention`
    });
  }

  if (analysis.strengths.length >= 3) {
    analysis.recommendations.push({
      type: "positive",
      message: "Strong performance in multiple subjects! Consider enrichment activities"
    });
  }

  if (analysis.gradeBreakdown.B > 0) {
    analysis.recommendations.push({
      type: "urgent",
      message: "Schedule a parent-teacher meeting to discuss support strategies"
    });
  }

  return analysis;
}

exports.handler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "No file provided" })
      };
    }

    const buffer = Buffer.from(event.body, "base64");
    const data = await pdf(buffer);
    const text = data.text;

    const subjects = {};

    allSubjects.forEach(subject => {
      const patterns = [
        new RegExp(`${subject}\\s+(E|M|A|B)`, "i"),
        new RegExp(`${subject}.*?\\s+(E|M|A|B)`, "i"),
        new RegExp(`${subject}\\s*[:\\-]?\\s*(E|M|A|B)`, "i")
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          subjects[subject] = match[1].toUpperCase();
          break;
        }
      }
    });

    if (Object.keys(subjects).length === 0) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects: {},
          analysis: null,
          message: "No grades detected. Please ensure the PDF contains CBC results with grades (E, M, A, B)."
        })
      };
    }

    const analysis = analyzePerformance(subjects);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjects, analysis })
    };
  } catch (error) {
    console.error("PDF analysis error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Failed to analyze PDF",
        message: "Please ensure you uploaded a valid PDF file with CBC results."
      })
    };
  }
};
