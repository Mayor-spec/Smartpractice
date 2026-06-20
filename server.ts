import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google Gemini API on the server side securely
// Never expose the API key to the client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API: Generate questions with Gemini 3.5 Flash
app.post("/api/generate-questions", async (req, res) => {
  try {
    const { category, difficulty, count } = req.body;

    if (!category || !difficulty || !count) {
      res.status(400).json({ error: "Missing required parameters: category, difficulty, count" });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ 
        error: "GEMINI_API_KEY is not configured on the server. Please define it in your Secrets / Env Variables." 
      });
      return;
    }

    // Build optimized prompt detailing targeted factual knowledge for WGTBAM 2.0
    const promptText = `Generate exactly ${count} multiple-choice quiz questions for contestants preparing for WGTBAM 2.0 (Who Gets To Be A Millionaire).

Category: ${category}
Difficulty: ${difficulty}

Core factual focus areas for each category:
- "Governance & OAU History" focuses strictly on historical and current facts of Obafemi Awolowo University (Great Ife) landmarks (e.g., Amphi, Spider, Moremi, Oduduwa Hall), prominent student union leaders, great historical student struggles/politics, chancellors, vice-chancellors, administrative structures, and global OAU organization history.
- "General Affairs" focuses on Nigerian, African, and international political systems, geography, current affairs, policies, global structures (ECOWAS, UN, AU), and milestones.
- "Sports" focuses on Olympic, international football/athletics (World Cup, Premier League, AFCON), and legendary Nigerian/African sports history, records, clubs, and personalities.
- "Entertainment" focuses on Nollywood milestones, classic and modern music (Afrobeats, global pop icons), movie awards, pop-culture records, and viral media events.

Strict guidelines for output:
- Each question must be highly educational, highly accurate, and completely factual.
- Each question must have four options (optionA, optionB, optionC, optionD).
- Include the correctAnswer exactly as A, B, C, or D.
- Double-check that options are plausible but exactly one is the correct factual answer.
- Keep the difficulty strictly relevant to: ${difficulty}. Easy should be common known facts, Medium should be moderately detailed, and Hard should challenge serious trivia buffs.
- Output MUST strictly adhere to the requested schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              optionA: { type: Type.STRING },
              optionB: { type: Type.STRING },
              optionC: { type: Type.STRING },
              optionD: { type: Type.STRING },
              correctAnswer: { 
                type: Type.STRING, 
                description: "Must be exactly 'A', 'B', 'C', or 'D'" 
              }
            },
            required: ["question", "optionA", "optionB", "optionC", "optionD", "correctAnswer"]
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No text response returned by the Gemini model.");
    }

    const questions = JSON.parse(responseText.trim());
    res.json({ success: true, questions });
  } catch (error: any) {
    console.error("Failed to generate questions using Gemini API:", error);
    res.status(500).json({ 
      error: "Failed to generate questions due to an API error.",
      details: error.message || error 
    });
  }
});

// Configure Vite middleware or serve static static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server live on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
