console.log("> System initializing..."); // This proves the file is being read

// --- INSTRUCTIONS ---
// 1. Ensure this file is named 'server.js' inside the 'backend' folder.
// 2. Ensure your .env file has the GEMINI_API_KEY.
// 3. Run: node server.js

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allows your frontend to talk to this backend
app.use(express.json());

// Initialize Gemini
// Ensure your .env file has: GEMINI_API_KEY=your_actual_key_here
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ROOT ROUTE (Health Check)
app.get('/', (req, res) => {
  res.send('Whip Montez Backend System Online. Uplink Established.');
});

// GENERATION ROUTE
// Your frontend App.jsx will call this URL
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;

    console.log("Received generation request...");

    // Logic to select model
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Generation successful.");
    res.json({ output: text });

  } catch (error) {
    console.error('Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate content', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`> Server running on http://localhost:${PORT}`);
  console.log('> Uplink Ready.');
});