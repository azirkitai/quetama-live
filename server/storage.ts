import { type User, type InsertUser, type Patient, type InsertPatient, type Setting, type InsertSetting, type Media, type InsertMedia, type TextGroup, type InsertTextGroup, type Theme, type InsertTheme } from "@shared/schema";

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
  
  // Settings methods
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  getSettingsByCategory(category: string): Promise<Setting[]>;
  setSetting(key: string, value: string, category: string): Promise<Setting>;
  updateSetting(key: string, value: string): Promise<Setting | undefined>;
  deleteSetting(key: string): Promise<boolean>;
  
  // Media methods
  getMedia(): Promise<Media[]>;
  getMediaById(id: string): Promise<Media | undefined>;
  createMedia(media: InsertMedia): Promise<Media>;
  updateMedia(id: string, updates: Partial<Media>): Promise<Media | undefined>;
  deleteMedia(id: string): Promise<boolean>;
  getActiveMedia(): Promise<Media[]>;
  
  // Theme methods
  getThemes(): Promise<Theme[]>;
  getActiveTheme(): Promise<Theme | undefined>;
  getThemeById(id: string): Promise<Theme | undefined>;
  createTheme(theme: InsertTheme): Promise<Theme>;
  updateTheme(id: string, updates: Partial<Theme>): Promise<Theme | undefined>;
  deleteTheme(id: string): Promise<boolean>;
  setActiveTheme(id: string): Promise<Theme | undefined>;
  
  // Text Group methods
  getTextGroups(): Promise<TextGroup[]>;
  getActiveTextGroups(): Promise<TextGroup[]>;
  getTextGroupByName(groupName: string): Promise<TextGroup | undefined>;
  getTextGroupById(id: string): Promise<TextGroup | undefined>;
  createTextGroup(textGroup: InsertTextGroup): Promise<TextGroup>;
  updateTextGroup(id: string, updates: Partial<TextGroup>): Promise<TextGroup | undefined>;
  deleteTextGroup(id: string): Promise<boolean>;
  toggleTextGroupStatus(id: string): Promise<TextGroup | undefined>;
  
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private patients: Map<string, Patient>;
  private windows: Map<string, Window>;
  private settings: Map<string, Setting>;
  private media: Map<string, Media>;
  private themes: Map<string, Theme>;
  private textGroups: Map<string, TextGroup>;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.windows = new Map();
    this.settings = new Map();
    this.media = new Map();
    this.themes = new Map();
    this.textGroups = new Map();
    
    // Initialize default settings, theme, and text groups
    this.initializeDefaultSettings();
    this.initializeDefaultTheme();
    this.initializeDefaultTextGroups();
  }
  
  private async initializeDefaultSettings() {
    // Only create default settings if they don't already exist
    const defaultSettings = [
      { key: "mediaType", value: "image", category: "display" },
      { key: "theme", value: "blue", category: "display" },
      { key: "showPrayerTimes", value: "true", category: "display" },
      { key: "showWeather", value: "false", category: "display" },
      { key: "marqueeText", value: "Selamat datang ke Klinik Kesihatan", category: "display" },
      { key: "marqueeColor", value: "#ffffff", category: "display" },
      { key: "enableSound", value: "true", category: "sound" },
      { key: "volume", value: "70", category: "sound" },
      { key: "soundMode", value: "preset", category: "sound" },
      { key: "presetKey", value: "airport_call", category: "sound" }
    ];

    for (const setting of defaultSettings) {
      // Only set if the setting doesn't already exist
      if (!this.settings.has(setting.key)) {
        await this.setSetting(setting.key, setting.value, setting.category);
      }
    }
  }
  
  private async initializeDefaultTheme() {
    const defaultTheme: Theme = {
      id: randomUUID(),
      name: "Default Theme",
      isActive: true,
      primaryColor: "#3b82f6",
      secondaryColor: "#6b7280",
      callingColor: "#3b82f6",
      highlightBoxColor: "#ef4444",
      historyNameColor: "#6b7280",
      clinicNameColor: "#1f2937",
      callingGradient: null,
      highlightBoxGradient: null,
      historyNameGradient: null,
      clinicNameGradient: null,
      backgroundColor: "#ffffff",
      accentColor: "#f3f4f6",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.themes.set(defaultTheme.id, defaultTheme);
  }
  
  private async initializeDefaultTextGroups() {
    const defaultTextGroups: TextGroup[] = [
      {
        id: randomUUID(),
        groupName: "clinic_name",
        displayName: "Clinic Name",
        description: "Main clinic name display text",
        color: "#1f2937",
        backgroundColor: null,
        fontSize: "clamp(2rem, 3.5vw, 3.5rem)",
        fontWeight: "bold",
        textAlign: "center",
        gradient: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    
    for (const textGroup of defaultTextGroups) {
      this.textGroups.set(textGroup.id, textGroup);
    }
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
      isActive: true,
      clinicName: insertUser.clinicName || "Klinik Utama 24 Jam",
      clinicLocation: insertUser.clinicLocation || "Tropicana Aman",
      createdAt: new Date(),
      lastLogin: null
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
      lastWindowId: null,
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

    // Preserve last window before clearing for completed/requeue status
    let lastWindowId = patient.lastWindowId;
    if ((status === "completed" || status === "requeue") && patient.windowId) {
      lastWindowId = patient.windowId;
    }

    const updatedPatient = {
      ...patient,
      status,
      windowId: windowId === null ? null : (windowId || patient.windowId),
      lastWindowId: lastWindowId,
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
    // Get the most recently called patient - including requeued patients
    // Keep showing the last called patient until a new one is called
    const calledPatients = Array.from(this.patients.values())
      .filter(p => p.status === 'called' || p.status === 'requeue' || p.status === 'completed' || p.status === 'in-progress')
      .filter(p => p.calledAt) // Only patients that have actually been called
      .sort((a, b) => {
        const timeA = a.calledAt?.getTime() || a.registeredAt.getTime();
        const timeB = b.calledAt?.getTime() || b.registeredAt.getTime();
        return timeB - timeA;
      });
    
    return calledPatients[0];
  }

  async getRecentHistory(limit: number = 10): Promise<Patient[]> {
    // Get all patients that have been called - include requeued patients in history
    // Don't clear history even when patients are requeued
    return Array.from(this.patients.values())
      .filter(p => p.status === 'called' || p.status === 'completed' || p.status === 'requeue' || p.status === 'in-progress')
      .filter(p => p.calledAt) // Only include patients that have actually been called
      .sort((a, b) => {
        const timeA = a.calledAt?.getTime() || 0;
        const timeB = b.calledAt?.getTime() || 0;
        return timeB - timeA; // Most recent call first
      })
      .slice(0, limit);
  }

  // Settings methods implementation
  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    return this.settings.get(key);
  }

  async getSettingsByCategory(category: string): Promise<Setting[]> {
    return Array.from(this.settings.values()).filter(
      (setting) => setting.category === category
    );
  }

  async setSetting(key: string, value: string, category: string): Promise<Setting> {
    const setting: Setting = {
      id: randomUUID(),
      key,
      value,
      category,
    };
    this.settings.set(key, setting);
    return setting;
  }

  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    const existingSetting = this.settings.get(key);
    if (!existingSetting) {
      return undefined;
    }
    
    const updatedSetting: Setting = {
      ...existingSetting,
      value,
    };
    this.settings.set(key, updatedSetting);
    return updatedSetting;
  }

  async deleteSetting(key: string): Promise<boolean> {
    return this.settings.delete(key);
  }

  // Media methods implementation
  async getMedia(): Promise<Media[]> {
    return Array.from(this.media.values());
  }

  async getMediaById(id: string): Promise<Media | undefined> {
    return this.media.get(id);
  }

  async createMedia(insertMedia: InsertMedia): Promise<Media> {
    const id = randomUUID();
    const media: Media = {
      ...insertMedia,
      id,
      uploadedAt: new Date(),
      isActive: true,
    };
    this.media.set(id, media);
    return media;
  }

  async updateMedia(id: string, updates: Partial<Media>): Promise<Media | undefined> {
    const media = this.media.get(id);
    if (!media) return undefined;

    const updatedMedia = { ...media, ...updates };
    this.media.set(id, updatedMedia);
    return updatedMedia;
  }

  async deleteMedia(id: string): Promise<boolean> {
    return this.media.delete(id);
  }

  async getActiveMedia(): Promise<Media[]> {
    return Array.from(this.media.values()).filter(media => media.isActive);
  }
  
  // Theme methods implementation
  async getThemes(): Promise<Theme[]> {
    return Array.from(this.themes.values());
  }

  async getActiveTheme(): Promise<Theme | undefined> {
    return Array.from(this.themes.values()).find(theme => theme.isActive);
  }

  async getThemeById(id: string): Promise<Theme | undefined> {
    return this.themes.get(id);
  }

  async createTheme(insertTheme: InsertTheme): Promise<Theme> {
    const id = randomUUID();
    const theme: Theme = {
      name: "New Theme",
      primaryColor: "#3b82f6",
      secondaryColor: "#6b7280",
      callingColor: "#3b82f6",
      highlightBoxColor: "#ef4444",
      historyNameColor: "#6b7280",
      clinicNameColor: "#1f2937",
      callingGradient: null,
      highlightBoxGradient: null,
      historyNameGradient: null,
      clinicNameGradient: null,
      backgroundColor: "#ffffff",
      accentColor: "#f3f4f6",
      ...insertTheme,
      id,
      isActive: false, // New themes are inactive by default
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.themes.set(id, theme);
    return theme;
  }

  async updateTheme(id: string, updates: Partial<Theme>): Promise<Theme | undefined> {
    const theme = this.themes.get(id);
    if (!theme) return undefined;

    const updatedTheme = { 
      ...theme, 
      ...updates,
      updatedAt: new Date(),
    };
    this.themes.set(id, updatedTheme);
    return updatedTheme;
  }

  async deleteTheme(id: string): Promise<boolean> {
    const theme = this.themes.get(id);
    if (!theme) return false;
    
    // Don't allow deleting the active theme
    if (theme.isActive) return false;
    
    return this.themes.delete(id);
  }

  async setActiveTheme(id: string): Promise<Theme | undefined> {
    const newActiveTheme = this.themes.get(id);
    if (!newActiveTheme) return undefined;

    // Deactivate all themes first
    const allThemes = Array.from(this.themes.values());
    for (const theme of allThemes) {
      if (theme.isActive) {
        await this.updateTheme(theme.id, { isActive: false });
      }
    }

    // Activate the selected theme
    return await this.updateTheme(id, { isActive: true });
  }

  // Text Group methods implementation
  async getTextGroups(): Promise<TextGroup[]> {
    return Array.from(this.textGroups.values());
  }

  async getActiveTextGroups(): Promise<TextGroup[]> {
    return Array.from(this.textGroups.values()).filter(group => group.isActive);
  }

  async getTextGroupByName(groupName: string): Promise<TextGroup | undefined> {
    return Array.from(this.textGroups.values()).find(group => group.groupName === groupName);
  }

  async getTextGroupById(id: string): Promise<TextGroup | undefined> {
    return this.textGroups.get(id);
  }

  async createTextGroup(insertTextGroup: InsertTextGroup): Promise<TextGroup> {
    const id = randomUUID();
    const textGroup: TextGroup = {
      id,
      groupName: insertTextGroup.groupName,
      displayName: insertTextGroup.displayName,
      description: insertTextGroup.description || null,
      color: insertTextGroup.color || "#ffffff",
      backgroundColor: insertTextGroup.backgroundColor || null,
      fontSize: insertTextGroup.fontSize || null,
      fontWeight: insertTextGroup.fontWeight || null,
      textAlign: insertTextGroup.textAlign || null,
      gradient: insertTextGroup.gradient || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.textGroups.set(id, textGroup);
    return textGroup;
  }

  async updateTextGroup(id: string, updates: Partial<TextGroup>): Promise<TextGroup | undefined> {
    const textGroup = this.textGroups.get(id);
    if (!textGroup) return undefined;

    const updatedTextGroup = { 
      ...textGroup, 
      ...updates,
      updatedAt: new Date(),
    };
    this.textGroups.set(id, updatedTextGroup);
    return updatedTextGroup;
  }

  async deleteTextGroup(id: string): Promise<boolean> {
    return this.textGroups.delete(id);
  }

  async toggleTextGroupStatus(id: string): Promise<TextGroup | undefined> {
    const textGroup = this.textGroups.get(id);
    if (!textGroup) return undefined;

    const updatedTextGroup = {
      ...textGroup,
      isActive: !textGroup.isActive,
      updatedAt: new Date(),
    };

    this.textGroups.set(id, updatedTextGroup);
    return updatedTextGroup;
  }

}

export const storage = new MemStorage();
