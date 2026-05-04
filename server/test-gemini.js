import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log("Fetching available models for your API key...");
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    
    if (data.error) {
      console.error("API Error:", data.error.message);
      return;
    }
    
    if (data.models) {
      const modelNames = data.models.map(m => m.name);
      console.log("Available models:");
      console.log(JSON.stringify(modelNames, null, 2));
    } else {
      console.log("No models returned:", data);
    }
  } catch (e) {
    console.error("Fetch failed:", e.message);
  }
}

listModels();
