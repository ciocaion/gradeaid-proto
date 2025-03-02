import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLearningContent, generateFeedback } from "./ai";
import { insertLearningProfileSchema, insertLearningSessionSchema } from "@shared/schema";
import { ZodError } from "zod";

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

  app.get("/api/sessions/profile/:profileId", async (req, res) => {
    const sessions = await storage.getSessionsByProfile(parseInt(req.params.profileId));
    res.json(sessions);
  });

  const httpServer = createServer(app);
  return httpServer;
}