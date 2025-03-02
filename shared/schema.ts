import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User preferences and learning profile
export const learningProfiles = pgTable("learning_profiles", {
  id: serial("id").primaryKey(),
  learningStyle: text("learning_style").notNull(),
  specialNeeds: text("special_needs"),
  preferredDemonstration: text("preferred_demonstration").notNull(),
  preferences: jsonb("preferences").notNull()
});

// Learning sessions to track progress
export const learningSessions = pgTable("learning_sessions", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id").notNull(),
  subject: text("subject").notNull(),
  content: jsonb("content").notNull(),
  feedback: text("feedback"),
  completed: boolean("completed").default(false)
});

// Insert schemas
export const insertLearningProfileSchema = createInsertSchema(learningProfiles)
  .extend({
    learningStyle: z.enum(["visual", "auditory", "interactive", "reading"]),
    preferredDemonstration: z.enum(["quiz", "project", "discussion", "writing"]),
    preferences: z.object({
      textSize: z.string(),
      highContrast: z.boolean(),
      voiceEnabled: z.boolean()
    })
  });

export const insertLearningSessionSchema = createInsertSchema(learningSessions);

// Types
export type LearningProfile = typeof learningProfiles.$inferSelect;
export type InsertLearningProfile = z.infer<typeof insertLearningProfileSchema>;
export type LearningSession = typeof learningSessions.$inferSelect;
export type InsertLearningSession = z.infer<typeof insertLearningSessionSchema>;
