import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLearningContent, generateFeedback, analyzeActivityImage } from "./ai";
import { insertLearningProfileSchema, insertLearningSessionSchema } from "@shared/schema";
import { ZodError } from "zod";
import openai from './openai';
import multer from 'multer';
import { Router } from "express";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

const router = Router();

export async function registerRoutes(app: Express): Promise<Server> {
  // Learning profile routes
  app.post("/api/profiles", async (req, res) => {
    try {
      const profileData = insertLearningProfileSchema.parse(req.body);
      const profile = await storage.createProfile(profileData);
      res.json(profile);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/profiles/:id", async (req, res) => {
    const profile = await storage.getProfile(parseInt(req.params.id));
    if (!profile) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }
    res.json(profile);
  });

  // Learning session routes
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertLearningSessionSchema.parse(req.body);
      const style = typeof sessionData.content === 'object' ?
        (sessionData.content as any)?.learningStyle || 'visual' : 'visual';
      const needs = typeof sessionData.content === 'object' ?
        (sessionData.content as any)?.specialNeeds : undefined;

      const content = await generateLearningContent(
        sessionData.subject,
        style,
        needs
      );

      const session = await storage.createSession({
        ...sessionData,
        content
      });

      res.json(session);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post("/api/sessions/:id/feedback", async (req, res) => {
    const { feedback } = req.body;
    const session = await storage.getSession(parseInt(req.params.id));

    if (!session) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    const aiFeedback = await generateFeedback(feedback, session.subject);
    const updated = await storage.updateSession(session.id, {
      feedback: aiFeedback,
      completed: true
    });

    res.json(updated);
  });

  app.post("/api/sessions/:id/ai-chat", async (req, res) => {
    try {
      const { message } = req.body;
      const session = await storage.getSession(parseInt(req.params.id));
      const profile = session ? await storage.getProfile(session.profileId) : null;

      if (!session || !profile) {
        res.status(404).json({ message: "Session or profile not found" });
        return;
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a friendly and encouraging AI tutor who specializes in adapting to ${profile.learningStyle} learning styles. Keep responses concise and engaging. Use emojis occasionally to make the conversation more lively.`
          },
          {
            role: "user",
            content: message
          }
        ]
      });

      res.json({ response: response.choices[0].message.content });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ message: "Failed to get AI response" });
    }
  });

  app.get("/api/sessions/profile/:profileId", async (req, res) => {
    const sessions = await storage.getSessionsByProfile(parseInt(req.params.profileId));
    res.json(sessions);
  });

  // New route for activity image analysis
  app.post("/api/activities/analyze", upload.single('image'), async (req, res) => {
    try {
      if (!req.file || !req.body.subject) {
        res.status(400).json({ message: "Missing image or subject" });
        return;
      }

      const imageBase64 = req.file.buffer.toString('base64');
      const subject = req.body.subject;

      const feedback = await analyzeActivityImage(imageBase64, subject);
      res.json({ feedback });
    } catch (error) {
      console.error('Error analyzing activity:', error);
      res.status(500).json({ message: "Failed to analyze image" });
    }
  });

  router.post("/api/tts", async (req, res) => {
    try {
      const { text } = req.body;
      
      // Using the Rachel voice which is child-friendly
      const VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.35,
            use_speaker_boost: true
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("ElevenLabs API error:", error);
        throw new Error("Failed to generate speech");
      }

      const audioBuffer = await response.arrayBuffer();
      
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Transfer-Encoding", "chunked");
      res.send(Buffer.from(audioBuffer));
    } catch (error) {
      console.error("TTS error:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

export { router };