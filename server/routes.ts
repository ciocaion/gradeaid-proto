import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLearningContent, generateFeedback, analyzeActivityImage } from "./ai";
import { insertLearningProfileSchema, insertLearningSessionSchema } from "@shared/schema";
import { ZodError } from "zod";
import openai from './openai';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

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

  const httpServer = createServer(app);
  return httpServer;
}