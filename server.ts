import express from "express";
import type { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' })); // Limit body size

const groqApiKey = process.env.GROQ_API_KEY;
const chatModel = process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile";
const reassuranceModel = process.env.GROQ_REASSURANCE_MODEL || "llama-3.3-70b-versatile";
let groq: Groq | null = null;
if (groqApiKey) {
  groq = new Groq({ apiKey: groqApiKey });
}

// Validation Schemas
const ReassuranceSchema = z.object({
  mood: z.string().min(1).max(50),
  reflection: z.string().min(1).max(2000),
  langName: z.string().min(1).max(50),
});

const ChatSchema = z.object({
  history: z.array(z.object({
    role: z.enum(["user", "model", "assistant"]),
    content: z.string().optional(),
    parts: z.array(z.object({ text: z.string() })).optional(),
  })).optional(),
  message: z.string().min(1).max(2000),
});

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});

const reassuranceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});

const SYSTEM_INSTRUCTION = `
You are Sukoon AI, a compassionate mental health companion for South Asian users.
Your goal is to provide a safe, culturally aware space for emotional expression.
You understand English, Hindi, and Urdu.

CRITICAL RULES:
- NEVER give the same response for different emotions.
- Be brief (2-4 lines max).
- Use a human, non-judgmental tone. No robotic phrasing or therapy clichés.
- Reflect the user's exact emotional state before giving guidance.
- If in serious crisis, encourage professional help.

MOOD-SPECIFIC BEHAVIOR:
1. Overwhelmed: Acknowledge the overload and sense of chaos. Suggest breaking things into tiny steps or simple prioritization/grounding.
2. Anxious: Address racing thoughts or uncertainty. Offer reassurance and exactly one calming technique.
3. Low: Use a softer, empathetic tone. Validate their lack of energy. Suggest one very small, low-effort action.
4. Okay: Maintain a neutral-positive tone. DO NOT give calming advice or "breathe" prompts. Ask a light follow-up or offer optional support.
`;

app.post("/api/reassurance", reassuranceLimiter, async (req: Request, res: Response) => {
  if (!groq) {
    res.status(503).json({ error: "Service unavailable." });
    return;
  }

  const result = ReassuranceSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid request data", details: result.error.format() });
    return;
  }

  const { mood, reflection, langName } = result.data;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        {
          role: "user",
          content: `THE USER'S CURRENT MOOD: ${mood.toUpperCase()}\nUSER REFLECTION: "${reflection}"\n\nRules for this response:\n- Acknowledge their exact state of feeling ${mood}.\n- Follow the specific MOOD-SPECIFIC BEHAVIOR for ${mood} defined in instructions.\n- Reply in ${langName}.`,
        },
      ],
      model: reassuranceModel,
      temperature: 0.7,
    });

    res.json({ text: chatCompletion.choices[0]?.message?.content || "" });
  } catch (error) {
    console.error("Groq reassurance error:", error);
    res.status(500).json({ error: "I am here for you, even if the connection is slow. Take a deep breath." });
  }
});

app.post("/api/chat", apiLimiter, async (req: Request, res: Response) => {
  if (!groq) {
    res.status(503).json({ error: "Service unavailable." });
    return;
  }

  const result = ChatSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Invalid request data" });
    return;
  }

  const { history, message } = result.data;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const messages = [
      { role: "system" as const, content: SYSTEM_INSTRUCTION },
      ...(history || []).map((m: any) => ({
        role: m.role === "model" ? ("assistant" as const) : ("user" as const),
        content: m.content || m.parts?.[0]?.text || "",
      })),
      { role: "user" as const, content: message },
    ];

    const stream = await groq.chat.completions.create({
      messages,
      model: chatModel,
      temperature: 0.7,
      stream: true,
    });

    // Handle client disconnect
    let closed = false;
    req.on("close", () => { closed = true; });

    for await (const chunk of stream) {
      if (closed) break;
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    if (!closed) {
      res.write(`data: "[DONE]"\n\n`);
    }
    res.end();
  } catch (error) {
    console.error("Groq chat error:", error);
    res.write(`data: ${JSON.stringify({ error: "I lost connection for a moment. Please try sending that again." })}\n\n`);
    res.end();
  }
});

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
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
