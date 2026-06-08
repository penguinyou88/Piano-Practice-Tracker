import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize the Gemini API client correctly using named parameters as instructed
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// A robust server-side endpoint for parsing teacher's lesson notes into a kid-friendly checklist
app.post("/api/parse-notes", async (req, res) => {
  const { notesText } = req.body;
  if (!notesText || typeof notesText !== "string") {
    return res.status(400).json({ error: "notesText is required and must be a string." });
  }

  try {
    const prompt = `You are a warm, helpful piano teacher's assistant. Your job is to parse the raw teacher's lesson notes into a structured JSON checklist for a child (aged 6-12) to follow during their daily practice.
    
    Please categorize items into exactly three arrays:
    1. "pieces": Pieces, songs, or repertoire being practiced. Include dynamic, goals, or measures (e.g., "Bars 1-8").
    2. "technique": Scales, arpeggios, Hanon exercises, physical posture, wrist tips.
    3. "theory": Written homework, flashcards, reading workbook tasks. If there are no assignments, leave this empty.

    Create a cute, kid-friendly name and key goal for each discovered homework.
    Also extract the teacher's name (or default to "Mrs. Henderson") and a motivating summaryQuote of what they should focus on.

    Teacher notes raw text:
    """
    ${notesText}
    """`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["pieces", "technique", "theory", "summaryQuote", "teacherName"],
          properties: {
            pieces: {
              type: Type.ARRAY,
              description: "Structured piece practice elements",
              items: {
                type: Type.OBJECT,
                required: ["id", "title", "goal"],
                properties: {
                  id: { type: Type.STRING, description: "CamelCase or slug ID" },
                  title: { type: Type.STRING, description: "Name of the song" },
                  goal: { type: Type.STRING, description: "Brief daily practice target" }
                }
              }
            },
            technique: {
              type: Type.ARRAY,
              description: "Structured technical elements",
              items: {
                type: Type.OBJECT,
                required: ["id", "title", "goal"],
                properties: {
                  id: { type: Type.STRING, description: "CamelCase or slug ID" },
                  title: { type: Type.STRING, description: "Technical category name" },
                  goal: { type: Type.STRING, description: "Core technique goal" }
                }
              }
            },
            theory: {
              type: Type.ARRAY,
              description: "Theory worksheets or workbook exercises",
              items: {
                type: Type.OBJECT,
                required: ["id", "title", "goal"],
                properties: {
                  id: { type: Type.STRING, description: "CamelCase or slug ID" },
                  title: { type: Type.STRING, description: "Homework title" },
                  goal: { type: Type.STRING, description: "Specific written goal" }
                }
              }
            },
            summaryQuote: {
              type: Type.STRING,
              description: "Encouraging short advice note"
            },
            teacherName: {
              type: Type.STRING,
              description: "Teacher name (e.g. Mrs. Henderson)"
            }
          }
        }
      }
    });

    const parsedJson = JSON.parse(response.text || "{}");
    return res.json(parsedJson);

  } catch (error: any) {
    console.error("Gemini parse-notes failed:", error);
    return res.status(500).json({ error: error?.message || "Internal Server Error parsing Notes" });
  }
});

// Configure Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Use Vite's middlewares handler to serve static assets and process React files
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Piano Practice dynamic server running on port ${PORT}`);
  });
}

startServer();
