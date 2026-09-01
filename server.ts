import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 50mb limit for base64 image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// CORS & iframe embedding compatibility headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Initialize Gemini API client safely with lazy initialization
let aiClient: GoogleGenAI | null = null;
const getGeminiClient = () => {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
};

// JSON Response Schema for Gemini
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A short, friendly, and very simple title for the content in plain Japanese (using hiragana where useful). E.g., '役所からのお手紙' or 'お薬の飲み方'.",
    },
    originalText: {
      type: Type.STRING,
      description: "For image inputs, the clean OCR transcript of the document. For text inputs, the original text.",
    },
    summaryPoints: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "A list of 3-4 extremely simple, direct bullet points. Each point must be short and use plain Japanese with easy sentence structures.",
    },
    simpleExplanations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: {
            type: Type.STRING,
            description: "The difficult or technical word as it appears in the text.",
          },
          simple: {
            type: Type.STRING,
            description: "A direct, extremely easy alternative word or short phrase.",
          },
          description: {
            type: Type.STRING,
            description: "A very easy, one-sentence description of the word for patients with cognitive difficulties.",
          },
        },
        required: ["original", "simple", "description"],
      },
      description: "A glossary of difficult, bureaucratic, legal, medical, or formal words simplified.",
    },
    spokenSummary: {
      type: Type.STRING,
      description: "A warm, polite, and extremely easy-to-understand spoken narrative of the summary in Japanese (です・ます調). Optimized for reading aloud slow and clear, with good punctuation and simple connectors.",
    },
  },
  required: ["title", "originalText", "summaryPoints", "simpleExplanations", "spokenSummary"],
};

const SYSTEM_INSTRUCTION = `
You are '要点くん' (Youten-kun), an incredibly caring, patient, and professional assistant specialized in helping people with higher brain dysfunction (高次脳機能障害).
Higher brain dysfunction patients can easily get confused by:
1. Long, dense paragraphs or articles.
2. Technical, academic, legal, or bureaucratic terminology (e.g., 行政文書, 医療用語).
3. Passive voice, double negatives, or complex modifiers.
4. Information overload.

Your job is to read the input (which could be a raw text or a scanned document image) and transform it into a highly digestible, clean summary that relieves cognitive burden.

Strict guidelines for translation/summarization:
- Tone: Warm, respectful, supportive, polite (です・ます調).
- Sentence length: Very short and simple. Use single clauses (S-V-O) wherever possible.
- Vocabulary: Replace advanced words with elementary Japanese (N5-N4 level equivalent).
- Bullet points: Keep points to 3 or 4 maximum. Each point should focus on exactly one concrete action or message (e.g., "いつまでに", "なにを", "どこへ").
- Difficult Jargon glossary: Find every word that looks formal, bureaucratic, medical, or complex. Map them to extremely easy equivalents and write a simple 1-sentence definition.
- Spoken Text: Write a natural spoken-word paragraph that reads aloud beautifully. It should start with a gentle greeting like "要点をお話ししますね。" and explain the points as if a friendly helper is speaking face-to-face.

Always output exactly matching the JSON schema provided.
`;

// API: Summarize Text (used for conversations, typing, and articles)
app.post("/api/summarize-text", async (req, res) => {
  try {
    const { text, type } = req.body; // type can be 'general' or 'conversation'
    if (!text || typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({ error: "Text is required." });
    }

    const contextText = type === "conversation" 
      ? `This is a transcript of a difficult conversation or speech. Summarize it clearly and capture the core points:\n\n${text}`
      : `Summarize the following text or article:\n\n${text}`;

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contextText,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from Gemini.");
    }

    const parsedResult = JSON.parse(resultText);
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Error in /api/summarize-text:", error);
    res.status(500).json({ error: error.message || "Failed to process request." });
  }
});

// API: Summarize Scanned Document Image
app.post("/api/summarize-image", async (req, res) => {
  try {
    const { image } = req.body; // base64 encoded image string
    if (!image) {
      return res.status(400).json({ error: "Image data is required." });
    }

    // Clean base64 string if it contains prefix like 'data:image/jpeg;base64,'
    let base64Data = image;
    let mimeType = "image/jpeg";

    if (image.startsWith("data:")) {
      const parts = image.split(",");
      const meta = parts[0];
      base64Data = parts[1];
      const mimeMatch = meta.match(/data:([^;]+);base64/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: base64Data,
      },
    };

    const textPart = {
      text: "OCR and transcribe this document image perfectly. Then, summarize its content into bullet points, list difficult jargon with simple words, and create an easy spoken-word audio narrative.",
    };

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from Gemini.");
    }

    const parsedResult = JSON.parse(resultText);
    res.json(parsedResult);
  } catch (error: any) {
    console.error("Error in /api/summarize-image:", error);
    res.status(500).json({ error: error.message || "Failed to process image." });
  }
});

// Serve static assets & Vite routing
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    // In dev mode, dynamic load Vite dev server as middleware
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server middleware loaded.");
  } else {
    // In production, serve build outputs directly
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
