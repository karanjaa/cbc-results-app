const pdf = require("pdf-parse");

exports.handler = async (event) => {
  try {
    const buffer = Buffer.from(event.body, "base64");
    const data = await pdf(buffer);
    const text = data.text;

    const subjects = {};

    const subjectList = [
      "English",
      "Mathematics",
      "Science",
      "Kiswahili",
      "Social Studies",
      "Creative Arts"
    ];

    subjectList.forEach(subject => {
      const regex = new RegExp(`${subject}\\s+(E|M|A|B)`, "i");
      const match = text.match(regex);
      if (match) {
        subjects[subject] = match[1].toUpperCase();
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ subjects })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "PDF analysis failed" })
    };
  }
};
