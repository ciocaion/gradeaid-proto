import { LearningProfile, InsertLearningProfile, LearningSession, InsertLearningSession } from "@shared/schema";

export interface IStorage {
  // Learning Profile operations
  createProfile(profile: InsertLearningProfile): Promise<LearningProfile>;
  getProfile(id: number): Promise<LearningProfile | undefined>;
  updateProfile(id: number, profile: Partial<InsertLearningProfile>): Promise<LearningProfile | undefined>;
  
  // Learning Session operations
  createSession(session: InsertLearningSession): Promise<LearningSession>;
  getSession(id: number): Promise<LearningSession | undefined>;
  updateSession(id: number, session: Partial<InsertLearningSession>): Promise<LearningSession | undefined>;
  getSessionsByProfile(profileId: number): Promise<LearningSession[]>;
}

export class MemStorage implements IStorage {
  private profiles: Map<number, LearningProfile>;
  private sessions: Map<number, LearningSession>;
  private currentProfileId: number;
  private currentSessionId: number;

  constructor() {
    this.profiles = new Map();
    this.sessions = new Map();
    this.currentProfileId = 1;
    this.currentSessionId = 1;
  }

  async createProfile(profile: InsertLearningProfile): Promise<LearningProfile> {
    const id = this.currentProfileId++;
    const newProfile = { ...profile, id };
    this.profiles.set(id, newProfile);
    return newProfile;
  }

  async getProfile(id: number): Promise<LearningProfile | undefined> {
    return this.profiles.get(id);
  }

  async updateProfile(id: number, profile: Partial<InsertLearningProfile>): Promise<LearningProfile | undefined> {
    const existing = this.profiles.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...profile };
    this.profiles.set(id, updated);
    return updated;
  }

  async createSession(session: InsertLearningSession): Promise<LearningSession> {
    const id = this.currentSessionId++;
    const newSession = { ...session, id };
    this.sessions.set(id, newSession);
    return newSession;
  }

  async getSession(id: number): Promise<LearningSession | undefined> {
    return this.sessions.get(id);
  }

  async updateSession(id: number, session: Partial<InsertLearningSession>): Promise<LearningSession | undefined> {
    const existing = this.sessions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...session };
    this.sessions.set(id, updated);
    return updated;
  }

  async getSessionsByProfile(profileId: number): Promise<LearningSession[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.profileId === profileId);
  }
}

export const storage = new MemStorage();
