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

// Helper to extract plain text and append style markers (like UNDERLINED or BOLD)
// so Gemini can easily detect the underlined lesson dates.
function extractTextWithStyles(doc: any): string {
  if (!doc || !doc.body || !doc.body.content) return "";
  let fullText = "";
  for (const element of doc.body.content) {
    if (element.paragraph) {
      let paragraphText = "";
      for (const run of element.paragraph.elements || []) {
        if (run.textRun) {
          let text = run.textRun.content || "";
          const style = run.textRun.textStyle || {};
          // Only tag non-whitespace headers
          const trimmed = text.trim();
          if (trimmed.length > 0) {
            if (style.underline) {
              text = `\n[UNDERLINED: ${trimmed}]\n`;
            } else if (style.bold) {
              text = `\n[BOLD: ${trimmed}]\n`;
            }
          }
          paragraphText += text;
        }
      }
      // Trim empty redundant returns but keep line breaks
      fullText += paragraphText + "\n";
    } else if (element.table) {
      for (const row of element.table.tableRows || []) {
        for (const cell of row.tableCells || []) {
          for (const cellElement of cell.content || []) {
            if (cellElement.paragraph) {
              for (const run of cellElement.paragraph.elements || []) {
                if (run.textRun) {
                  fullText += run.textRun.content || "";
                }
              }
            }
          }
          fullText += " | ";
        }
        fullText += "\n";
      }
    }
  }
  return fullText;
}

// Popup-based implicit OAuth redirect target for client-side authentication
app.get("/google-callback", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Google Docs Connection Success</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f0fdf4;
            color: #14532d;
            text-align: center;
          }
          .card {
            background: white;
            padding: 2.5rem;
            border-radius: 1.5rem;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05);
            max-width: 420px;
            border: 1px solid #bbf7d0;
          }
          h1 { color: #16a34a; margin-top: 0; font-size: 1.5rem; font-weight: 800; }
          p { color: #15803d; font-size: 0.95rem; font-weight: 600; line-height: 1.5; }
          .sub { color: #86efac; font-size: 0.75rem; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🎹 Connected!</h1>
          <p>We've connected to Google successfully. Syncing your lesson plan now...</p>
          <div class="sub">This window will close automatically.</div>
        </div>
        <script>
          const hash = window.location.hash;
          if (hash) {
            const params = {};
            const regex = /([^&=]+)=([^&]*)/g;
            let m;
            while (m = regex.exec(hash.substring(1))) {
              params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
            }
            if (params.access_token) {
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'GOOGLE_DOCS_AUTH_SUCCESS', 
                  token: params.access_token
                }, '*');
                setTimeout(() => window.close(), 1200);
              } else {
                document.querySelector('p').innerText = "Logged in successfully! You can close this window now.";
              }
            } else {
              document.querySelector('p').innerText = "Failed: No access token found in hash redirect.";
            }
          } else {
            const urlParams = new URLSearchParams(window.location.search);
            const error = urlParams.get('error');
            if (error) {
              document.querySelector('p').innerText = "Auth Error: " + error;
            } else {
              document.querySelector('p').innerText = "Ready to receive login. You may close this popup.";
            }
          }
        </script>
      </body>
    </html>
  `);
});

// Sync Google Doc and parse with Gemini
app.post("/api/sync-doc", async (req, res) => {
  const { documentId, accessToken } = req.body;
  if (!documentId || typeof documentId !== "string") {
    return res.status(400).json({ error: "documentId is required and must be a string." });
  }
  if (!accessToken || typeof accessToken !== "string") {
    return res.status(400).json({ error: "accessToken is required and must be a string." });
  }

  try {
    // 1. Fetch document from standard google docs endpoint API
    const docRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!docRes.ok) {
      const errText = await docRes.text();
      let errorDetail = "Failed to fetch document";
      try {
        const errJson = JSON.parse(errText);
        errorDetail = errJson.error?.message || errorDetail;
      } catch (e) {}
      return res.status(docRes.status).json({ error: `Google Docs API error: ${errorDetail}` });
    }

    const docJson = await docRes.json();

    // 2. Format with [UNDERLINED: Text] styles
    const docText = extractTextWithStyles(docJson);

    if (!docText.trim()) {
      return res.status(400).json({ error: "The Google Doc content was parsed but returned empty." });
    }

    // 3. Craft lesson note parsing instructions for Gemini 3.5 Flash
    const prompt = `You are a warm, helpful piano teacher's assistant.
We have fetched parent/student lesson notes from their Google Doc.
The teacher adds notes chronologically. Usually, each new lesson starts with an underlined or bolded date heading (which the parser has annotated as [UNDERLINED: Date] or [BOLD: Date]).
Look through the full transcribed document below. Identify and locate the notes for the ONE LATEST (most recent) lesson.
The latest lesson is usually located at the beginning or top of the document, marked by the most recent underlined or bolded date heading (e.g. date with underline).
Ignore previous lessons or previous weeks' notes, and ONLY extract lists and tasks from this ONE LATEST lesson!

Here is the document transcript:
"""
${docText}
"""

Please parse these latest notes into a structured JSON checklist for a child (aged 6-12) to follow during their daily practice.
Categorize items into exactly three arrays:
1. "pieces": Pieces, songs, or repertoire being practiced. Include dynamic, goals, or measures (e.g., "Bars 1-8").
2. "technique": Scales, arpeggios, Hanon exercises, physical posture, wrist tips.
3. "theory": Written homework, flashcards, reading workbook tasks. If there are no assignments, leave this empty.

Create a cute, kid-friendly name and key goal for each discovered homework.
Also extract the teacher's name (or default to "Mrs. Henderson") and a motivating summaryQuote of what they should focus on.`;

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
    return res.json({
      ...parsedJson,
      rawDocLength: docText.length
    });

  } catch (error: any) {
    console.error("Sync doc failed:", error);
    return res.status(500).json({ error: error?.message || "Internal Server Error syncing Google Doc" });
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
