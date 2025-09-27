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
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(userId: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(userId: string): Promise<boolean>;
  toggleUserStatus(userId: string): Promise<User | undefined>;
  
  // Patient methods
  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatients(): Promise<Patient[]>;
  getPatientsByDate(date: string): Promise<Patient[]>;
  getNextPatientNumber(): Promise<number>;
  updatePatientStatus(patientId: string, status: string, windowId?: string | null, requeueReason?: string): Promise<Patient | undefined>;
  deletePatient(patientId: string): Promise<boolean>;
  
  // Window methods
  getWindows(): Promise<Window[]>;
  createWindow(name: string): Promise<Window>;
  updateWindow(windowId: string, name: string): Promise<Window | undefined>;
  deleteWindow(windowId: string): Promise<boolean>;
  toggleWindowStatus(windowId: string): Promise<Window | undefined>;
  updateWindowPatient(windowId: string, patientId?: string): Promise<Window | undefined>;
  
  // Dashboard methods
  getDashboardStats(): Promise<{
    totalWaiting: number;
    totalCalled: number;
    totalCompleted: number;
    activeWindows: number;
    totalWindows: number;
  }>;
  getCurrentCall(): Promise<Patient | undefined>;
  getRecentHistory(limit?: number): Promise<Patient[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private patients: Map<string, Patient>;
  private windows: Map<string, Window>;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.windows = new Map();
    
    // No default data - all data must be created by users
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

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<boolean> {
    return this.users.delete(userId);
  }

  async toggleUserStatus(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser = { ...user, isActive: !user.isActive };
    this.users.set(userId, updatedUser);
    return updatedUser;
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
      requeueReason: null,
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

  async updatePatientStatus(patientId: string, status: string, windowId?: string | null, requeueReason?: string): Promise<Patient | undefined> {
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
      const reasonText = requeueReason ? ` - ${requeueReason}` : '';
      newTrackingHistory.push(`Requeued at ${timeString}${reasonText}`);
    }

    const updatedPatient = {
      ...patient,
      status,
      windowId: windowId === null ? null : (windowId || patient.windowId),
      requeueReason: status === "requeue" ? requeueReason || null : patient.requeueReason,
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

  async getDashboardStats(): Promise<{
    totalWaiting: number;
    totalCalled: number;
    totalCompleted: number;
    activeWindows: number;
    totalWindows: number;
  }> {
    const allPatients = Array.from(this.patients.values());
    const allWindows = Array.from(this.windows.values());
    
    // Get today's start and end boundaries (local timezone)
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const totalWaiting = allPatients.filter(p => p.status === 'waiting').length;
    const totalCalled = allPatients.filter(p => p.status === 'called').length;
    const totalCompleted = allPatients.filter(p => 
      p.status === 'completed' && 
      p.completedAt && 
      p.completedAt >= startOfDay && 
      p.completedAt <= endOfDay
    ).length;
    const activeWindows = allWindows.filter(w => w.isActive).length;
    const totalWindows = allWindows.length;

    return {
      totalWaiting,
      totalCalled,
      totalCompleted,
      activeWindows,
      totalWindows
    };
  }

  async getCurrentCall(): Promise<Patient | undefined> {
    // Get the most recently called patient
    const calledPatients = Array.from(this.patients.values())
      .filter(p => p.status === 'called')
      .sort((a, b) => {
        const timeA = a.calledAt?.getTime() || a.registeredAt.getTime();
        const timeB = b.calledAt?.getTime() || b.registeredAt.getTime();
        return timeB - timeA;
      });
    
    return calledPatients[0];
  }

  async getRecentHistory(limit: number = 10): Promise<Patient[]> {
    // Get all patients that have been called (called + completed), sorted by call time (most recent first)
    return Array.from(this.patients.values())
      .filter(p => p.status === 'called' || p.status === 'completed')
      .filter(p => p.calledAt) // Only include patients that have actually been called
      .sort((a, b) => {
        const timeA = a.calledAt?.getTime() || 0;
        const timeB = b.calledAt?.getTime() || 0;
        return timeB - timeA; // Most recent call first
      })
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
