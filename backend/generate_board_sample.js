const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function generateSample() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API Key found");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = "Write a short, punchy 4-line intro for a presentation to a Board of Directors about a new AI Music Studio platform called 'Studio Agents'. Make it professional but visionary.";

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("\n--- BOARD SAMPLE OUTPUT ---");
    console.log(text);
    console.log("---------------------------\n");
  } catch (error) {
    console.error("Generation failed:", error);
  }
}

generateSample();