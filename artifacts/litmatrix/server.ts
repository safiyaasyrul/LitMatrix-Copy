import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(import.meta.dirname, ".env") });

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json({ limit: "15mb" }));

// Server-side Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API health endpoint
app.get("/prisma-api/health", (_req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({ status: "ok", geminiAvailable: hasKey });
});

// Server-side Gemini generate endpoint with automatic model fallback
app.post("/prisma-api/gemini/generate", async (req, res) => {
  try {
    const { prompt, systemInstruction, model = "gemini-3.7-flash", maxOutputTokens = 4000, temperature = 0.3 } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({
        error: "GEMINI_API_KEY environment variable is not configured on the server. Please enter an API key in the UI or Settings.",
      });
    }

    const config: any = {
      temperature,
    };
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    // Normalize model name (map deprecated models to modern counterparts)
    let requestedModel = model;
    if (
      !requestedModel ||
      requestedModel.includes("gemini-2.5") ||
      requestedModel.includes("gemini-2.0") ||
      requestedModel.includes("gemini-1.5")
    ) {
      requestedModel = "gemini-3.7-flash";
    }

    // Try primary requested model, then fallback sequence
    const candidateModels = [
      requestedModel,
      "gemini-3.7-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-3.1-pro-preview",
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    let lastError: any = null;
    let responseText = "";

    for (const currentModel of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
          config,
        });
        if (response.text) {
          responseText = response.text;
          lastError = null;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${currentModel} failed: ${err.message || err}. Trying next fallback...`);
      }
    }

    if (responseText) {
      return res.json({ text: responseText });
    }

    if (lastError) {
      console.error("All Gemini model attempts failed:", lastError);
      return res.status(500).json({
        error: lastError.message || "Failed to generate content from Gemini models. You can also configure an alternative AI provider (OpenAI, Claude, Emergent, Replit, or Custom) in the AI Providers & API Keys tab.",
      });
    }

    res.json({ text: "" });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: error.message || "Failed to generate content from Gemini" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: path.resolve(import.meta.dirname),
      configFile: path.resolve(import.meta.dirname, "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(import.meta.dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
