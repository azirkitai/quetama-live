import { type User, type InsertUser, type Patient, type InsertPatient } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Patient methods
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatients(): Promise<Patient[]>;
  getPatientsByDate(date: string): Promise<Patient[]>;
  getNextPatientNumber(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private patients: Map<string, Patient>;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role || "user",
      isActive: true 
    };
    this.users.set(id, user);
    return user;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = randomUUID();
    const patient: Patient = {
      id,
      name: insertPatient.name || null,
      number: insertPatient.number,
      status: "waiting",
      windowId: null,
      registeredAt: new Date(),
      calledAt: null,
      completedAt: null,
      trackingHistory: []
    };
    this.patients.set(id, patient);
    return patient;
  }

  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }

  async getPatientsByDate(date: string): Promise<Patient[]> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    
    return Array.from(this.patients.values()).filter(
      (patient) => 
        patient.registeredAt >= startOfDay && 
        patient.registeredAt <= endOfDay
    );
  }

  async getNextPatientNumber(): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const todayPatients = await this.getPatientsByDate(today);
    return todayPatients.length + 1;
  }
}

export const storage = new MemStorage();
