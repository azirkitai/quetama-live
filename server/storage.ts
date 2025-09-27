import { type User, type InsertUser, type Patient, type InsertPatient } from "@shared/schema";

interface Window {
  id: string;
  name: string;
  isActive: boolean;
  currentPatientId?: string;
}
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
  updatePatientStatus(patientId: string, status: string, windowId?: string | null): Promise<Patient | undefined>;
  deletePatient(patientId: string): Promise<boolean>;
  
  // Window methods
  getWindows(): Promise<Window[]>;
  createWindow(name: string): Promise<Window>;
  updateWindow(windowId: string, name: string): Promise<Window | undefined>;
  deleteWindow(windowId: string): Promise<boolean>;
  toggleWindowStatus(windowId: string): Promise<Window | undefined>;
  updateWindowPatient(windowId: string, patientId?: string): Promise<Window | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private patients: Map<string, Patient>;
  private windows: Map<string, Window>;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.windows = new Map();
    
    // Initialize default windows
    this.initializeWindows();
  }

  private initializeWindows() {
    const defaultWindows: Window[] = [
      { id: "w1", name: "Bilik 1 - Dr. Sarah", isActive: true },
      { id: "w2", name: "Bilik 2 - Dr. Ahmad", isActive: true },
      { id: "w3", name: "Bilik 3 - Nurse Linda", isActive: true },
      { id: "w4", name: "Bilik 4 - Dr. Aisyah", isActive: false },
    ];
    
    defaultWindows.forEach(window => {
      this.windows.set(window.id, window);
    });
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

  async updatePatientStatus(patientId: string, status: string, windowId?: string | null): Promise<Patient | undefined> {
    const patient = this.patients.get(patientId);
    if (!patient) return undefined;

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // Update tracking history based on status change
    let newTrackingHistory = [...(patient.trackingHistory || [])];
    
    if (status === "called" && windowId) {
      const window = this.windows.get(windowId);
      if (window) {
        newTrackingHistory.push(`Called to ${window.name} at ${timeString}`);
        patient.calledAt = now;
      }
    } else if (status === "in-progress") {
      newTrackingHistory.push(`Consultation started at ${timeString}`);
    } else if (status === "completed") {
      newTrackingHistory.push(`Consultation completed at ${timeString}`);
      patient.completedAt = now;
    } else if (status === "requeue") {
      newTrackingHistory.push(`Requeued at ${timeString}`);
    }

    const updatedPatient = {
      ...patient,
      status,
      windowId: windowId === null ? null : (windowId || patient.windowId),
      trackingHistory: newTrackingHistory
    };

    this.patients.set(patientId, updatedPatient);
    return updatedPatient;
  }

  async deletePatient(patientId: string): Promise<boolean> {
    const deleted = this.patients.delete(patientId);
    
    // Remove patient from any windows
    if (deleted) {
      this.windows.forEach((window, windowId) => {
        if (window.currentPatientId === patientId) {
          this.windows.set(windowId, { ...window, currentPatientId: undefined });
        }
      });
    }
    
    return deleted;
  }

  async getWindows(): Promise<Window[]> {
    return Array.from(this.windows.values());
  }

  async createWindow(name: string): Promise<Window> {
    const id = randomUUID();
    const window: Window = {
      id,
      name: name.trim(),
      isActive: true
    };
    
    this.windows.set(id, window);
    return window;
  }

  async updateWindow(windowId: string, name: string): Promise<Window | undefined> {
    const window = this.windows.get(windowId);
    if (!window) return undefined;

    const updatedWindow = {
      ...window,
      name: name.trim()
    };

    this.windows.set(windowId, updatedWindow);
    return updatedWindow;
  }

  async deleteWindow(windowId: string): Promise<boolean> {
    const window = this.windows.get(windowId);
    if (!window) return false;

    // Check if window has a current patient - prevent deletion if occupied
    if (window.currentPatientId) {
      return false;
    }

    // Clear any patients assigned to this window
    this.patients.forEach((patient, patientId) => {
      if (patient.windowId === windowId) {
        this.patients.set(patientId, { ...patient, windowId: null });
      }
    });

    return this.windows.delete(windowId);
  }

  async toggleWindowStatus(windowId: string): Promise<Window | undefined> {
    const window = this.windows.get(windowId);
    if (!window) return undefined;

    const updatedWindow = {
      ...window,
      isActive: !window.isActive
    };

    this.windows.set(windowId, updatedWindow);
    return updatedWindow;
  }

  async updateWindowPatient(windowId: string, patientId?: string): Promise<Window | undefined> {
    const window = this.windows.get(windowId);
    if (!window) return undefined;

    const updatedWindow = {
      ...window,
      currentPatientId: patientId
    };

    this.windows.set(windowId, updatedWindow);
    return updatedWindow;
  }
}

export const storage = new MemStorage();
