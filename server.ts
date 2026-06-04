import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import { z } from "zod";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// 1. Production-grade CORS (CRITICAL)
const allowedOrigins = [
  "https://sukoon-3al3.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "capacitor://localhost",
  "https://localhost",
  "http://localhost",
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed list or firebase patterns
    const isAllowed = allowedOrigins.includes(origin) || 
                     origin.endsWith(".web.app") || 
                     origin.endsWith(".firebaseapp.com");
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS BEFORE all other middleware/routes
app.use(cors(corsOptions));

// Handle OPTIONS preflight globally (Extra safety)
app.options("*", cors(corsOptions));

// 2. Security Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "connect-src": [
        "'self'",
        "https://*.googleapis.com",
        "https://*.firebaseio.com",
        "wss://*.firebaseio.com",
        "https://*.firebasestorage.app",
        "https://sukoon-3al3.onrender.com",
        "capacitor://localhost",
        "https://localhost",
        "http://localhost:*",
        "https://api.groq.com"
      ],
      "img-src": ["'self'", "data:", "blob:", "https://*.googleapis.com", "https://*.firebasestorage.app", "https://*.googleusercontent.com"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      "frame-src": ["'self'", "https://*.firebaseapp.com"],
      "media-src": ["'self'", "blob:", "https://*.firebasestorage.app"],
    },
  },
}));

app.use(express.json({ limit: "10kb" }));

// 3. Groq API Setup with Stability Logic
const groqApiKey = process.env.GROQ_API_KEY;
const chatModel = process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile";
const reassuranceModel = process.env.GROQ_REASSURANCE_MODEL || "llama-3.3-70b-versatile";

if (!groqApiKey) {
  console.error("FATAL: GROQ_API_KEY is missing in environment variables.");
}

const groq = new Groq({ 
  apiKey: groqApiKey || "dummy-key", // Prevent crash on init, handle in routes
});

// Helper for Groq calls with retry and timeout
async function callGroqWithRetry(fn: () => Promise<any>, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      // Create a timeout promise
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Groq API Timeout")), 20000)
      );
      
      // Race the API call against the timeout
      return await Promise.race([fn(), timeout]);
    } catch (error: any) {
      const isLastAttempt = i === retries;
      const isRateLimit = error?.status === 429;
      
      console.error(`Groq attempt ${i + 1} failed:`, error.message);
      
      if (isLastAttempt) throw error;
      
      // Wait longer for rate limits
      const delay = isRateLimit ? 2000 : 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// 4. Validation Schemas
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

// 5. Rate limiters
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
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
1. Overwhelmed: Acknowledge the overload and sense of chaos. Suggest breaking things into tiny steps.
2. Anxious: Address racing thoughts. Offer reassurance and exactly one calming technique.
3. Low: Use a softer, empathetic tone. Validate lack of energy. Suggest one tiny action.
4. Okay: Maintain neutral-positive tone. Ask a light follow-up or offer optional support.
`;

// 6. Routes
// Health Check for Render
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

app.post("/api/reassurance", apiLimiter, async (req: Request, res: Response) => {
  console.log(`[REASSURANCE] Origin: ${req.get('origin') || 'no-origin'} | Mood: ${req.body.mood}`);
  
  if (!groqApiKey) return res.status(503).json({ error: "AI Service unconfigured." });

  const result = ReassuranceSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: "Invalid data" });

  const { mood, reflection, langName } = result.data;

  try {
    const chatCompletion = await callGroqWithRetry(() => groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        {
          role: "user",
          content: `MOOD: ${mood}\nREFLECTION: "${reflection}"\nLANG: ${langName}`,
        },
      ],
      model: reassuranceModel,
      temperature: 0.7,
    }));

    res.json({ text: chatCompletion.choices[0]?.message?.content || "I'm here for you." });
  } catch (error: any) {
    console.error("Final Reassurance Error:", error.message);
    res.status(error.status || 500).json({ 
      error: "I'm here for you, even if the connection is slow. Take a deep breath.",
      fallback: true 
    });
  }
});

app.post("/api/chat", apiLimiter, async (req: Request, res: Response) => {
  console.log(`[CHAT] Origin: ${req.get('origin') || 'no-origin'}`);
  
  if (!groqApiKey) return res.status(503).json({ error: "AI Service unconfigured." });

  const result = ChatSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: "Invalid data" });

  const { history, message } = result.data;

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable buffering for Nginx/Render

  try {
    const messages = [
      { role: "system" as const, content: SYSTEM_INSTRUCTION },
      ...(history || []).map((m: any) => ({
        role: m.role === "model" ? ("assistant" as const) : ("user" as const),
        content: m.content || m.parts?.[0]?.text || "",
      })),
      { role: "user" as const, content: message },
    ];

    const stream = await callGroqWithRetry(() => groq.chat.completions.create({
      messages,
      model: chatModel,
      temperature: 0.7,
      stream: true,
    }));

    let closed = false;
    req.on("close", () => { closed = true; });

    for await (const chunk of stream) {
      if (closed) break;
      const text = chunk.choices[0]?.delta?.content || "";
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    if (!closed) res.write(`data: "[DONE]"\n\n`);
    res.end();
  } catch (error: any) {
    console.error("Final Chat Error:", error.message);
    res.write(`data: ${JSON.stringify({ error: "I lost connection for a moment. Please try sending that again." })}\n\n`);
    res.end();
  }
});

// 7. Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Global Error:", err.message);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    error: "A server error occurred. We're working on it.",
    status: "error"
  });
});

// 8. Server Start Logic
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
    console.log(`🚀 Production server running on port ${PORT}`);
    console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
  });
}

startServer();
