import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, insertUserSchema, insertTextGroupSchema, insertThemeSchema } from "@shared/schema";
import multer from "multer";
import fs from "fs/promises";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow PNG and JPEG files
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Extend Express session types
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    username?: string;
    role?: string;
  }
}

// Helper function to sanitize user data (remove sensitive fields)
function sanitizeUser(user: any) {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
}

// Auth middleware to check session before any processing
function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Sesi tidak aktif" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username dan password diperlukan" });
      }
      
      const user = await storage.authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ error: "Username atau password salah" });
      }
      
      // Regenerate session ID to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "Ralat internal server" });
        }
        
        // Store user info in session
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        
        res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            clinicName: user.clinicName,
            clinicLocation: user.clinicLocation
          }
        });
      });
      
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Ralat internal server" });
    }
  });
  
  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Gagal logout" });
      }
      res.json({ success: true, message: "Logout berjaya" });
    });
  });
  
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Tidak ada sesi aktif" });
    }
    
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "Pengguna tidak dijumpai" });
      }
      
      res.json({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          clinicName: user.clinicName,
          clinicLocation: user.clinicLocation
        }
      });
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ error: "Ralat internal server" });
    }
  });

  // Setup static file serving for uploaded media
  const PUBLIC_OBJECT_SEARCH_PATHS = process.env.PUBLIC_OBJECT_SEARCH_PATHS;
  if (PUBLIC_OBJECT_SEARCH_PATHS) {
    try {
      let publicPath = 'uploads/public';
      try {
        const paths = JSON.parse(PUBLIC_OBJECT_SEARCH_PATHS);
        if (Array.isArray(paths) && paths.length > 0) {
          publicPath = paths[0].startsWith('/') ? paths[0].substring(1) : paths[0];
        }
      } catch (e) {
        publicPath = PUBLIC_OBJECT_SEARCH_PATHS.startsWith('/') ? PUBLIC_OBJECT_SEARCH_PATHS.substring(1) : PUBLIC_OBJECT_SEARCH_PATHS;
      }
      
      // Serve static files from the object storage path
      app.use(`/${publicPath}`, express.static(publicPath));
      console.log(`Static file serving enabled for: /${publicPath} -> ${publicPath}`);
    } catch (error) {
      console.error("Error setting up static file serving:", error);
    }
  }
  
  // Patient registration routes
  
  // Create new patient
  app.post("/api/patients", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      // Add userId from session to patient data
      const patientDataWithUser = {
        ...req.body,
        userId: req.session.userId
      };
      
      const patientData = insertPatientSchema.parse(patientDataWithUser);
      const patient = await storage.createPatient(patientData);
      res.json(patient);
    } catch (error) {
      console.error("Error creating patient:", error);
      res.status(400).json({ error: "Invalid patient data" });
    }
  });

  // Get all patients
  app.get("/api/patients", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const patients = await storage.getPatients(req.session.userId);
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });

  // Get today's patients
  app.get("/api/patients/today", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const today = new Date().toISOString().split('T')[0];
      const patients = await storage.getPatientsByDate(today, req.session.userId);
      res.json(patients);
    } catch (error) {
      console.error("Error fetching today's patients:", error);
      res.status(500).json({ error: "Failed to fetch today's patients" });
    }
  });

  // Get next patient number
  app.get("/api/patients/next-number", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const nextNumber = await storage.getNextPatientNumber(req.session.userId);
      res.json({ nextNumber });
    } catch (error) {
      console.error("Error getting next patient number:", error);
      res.status(500).json({ error: "Failed to get next patient number" });
    }
  });

  // Update patient status (for queue management)
  app.patch("/api/patients/:id/status", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { id } = req.params;
      const { status, windowId, requeueReason } = req.body;
      
      // Clear windowId for completed or requeue status
      const finalWindowId = (status === "completed" || status === "requeue") ? null : windowId;
      
      const patient = await storage.updatePatientStatus(id, status, finalWindowId, requeueReason, req.session.userId);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      
      // Update window assignment if needed
      if (windowId && status === "called") {
        await storage.updateWindowPatient(windowId, id, req.session.userId);
      } else if (status === "completed" || status === "requeue") {
        // Clear patient from window
        const windows = await storage.getWindows(req.session.userId);
        const currentWindow = windows.find(w => w.currentPatientId === id);
        if (currentWindow) {
          await storage.updateWindowPatient(currentWindow.id, undefined, req.session.userId);
        }
      }
      
      res.json(patient);
    } catch (error) {
      console.error("Error updating patient status:", error);
      res.status(500).json({ error: "Failed to update patient status" });
    }
  });

  // Delete patient
  app.delete("/api/patients/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { id } = req.params;
      const deleted = await storage.deletePatient(id, req.session.userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Patient not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting patient:", error);
      res.status(500).json({ error: "Failed to delete patient" });
    }
  });

  // User management routes
  
  // Get all users - REMOVED for tenant security
  // In multi-tenant system, each clinic is a user - no need to list other clinics
  app.get("/api/users", async (req, res) => {
    res.status(403).json({ 
      error: "Operasi tidak dibenarkan - dalam sistem multi-tenant, setiap klinik adalah pengguna berasingan"
    });
  });

  // Create new user - REMOVED for tenant security
  // In multi-tenant system, clinic accounts created through different process
  app.post("/api/users", async (req, res) => {
    res.status(403).json({ 
      error: "Operasi tidak dibenarkan - akaun klinik baru dibuat melalui proses registrasi berasingan"
    });
  });

  // Get specific user (Self only - tenant isolation)
  app.get("/api/users/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { id } = req.params;
      
      // TENANT SECURITY: Users can only view their own account
      if (req.session.userId !== id) {
        return res.status(403).json({ error: "Akses ditolak - hanya boleh lihat profil sendiri" });
      }
      
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Remove sensitive data like password from response
      const sanitizedUser = sanitizeUser(user);
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update user (Self only - tenant isolation)
  app.put("/api/users/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { id } = req.params;
      const updates = req.body;
      
      // TENANT SECURITY: Users can only update their own account
      if (req.session.userId !== id) {
        return res.status(403).json({ error: "Akses ditolak - hanya boleh update profil sendiri" });
      }
      
      // SECURITY: Validate and whitelist allowed update fields
      const allowedFields = ['username', 'clinicName', 'clinicLocation'];
      const validatedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key]) => allowedFields.includes(key))
      );
      
      if (Object.keys(validatedUpdates).length === 0) {
        return res.status(400).json({ error: "Tiada medan yang sah untuk dikemaskini" });
      }
      
      const user = await storage.updateUser(id, validatedUpdates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Toggle user status - REMOVED for tenant security
  // In multi-tenant system, users cannot disable their own clinic accounts
  app.patch("/api/users/:id/status", async (req, res) => {
    res.status(403).json({ 
      error: "Operasi tidak dibenarkan - akaun klinik tidak boleh dinyahaktifkan sendiri"
    });
  });

  // Delete user - REMOVED for tenant security
  // In multi-tenant system, clinic accounts cannot be self-deleted
  app.delete("/api/users/:id", async (req, res) => {
    res.status(403).json({ 
      error: "Operasi tidak dibenarkan - akaun klinik tidak boleh dihapuskan sendiri"
    });
  });

  // Get user display configuration
  app.get("/api/users/:id/display-config", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { id } = req.params;
      
      // SECURITY: Only allow users to view their own config
      if (req.session.userId !== id) {
        return res.status(403).json({ error: "Tidak dibenarkan mengakses data pengguna lain" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get all user-specific display configuration data using proper userId filtering
      const [settings, themes, media, textGroups] = await Promise.all([
        storage.getSettings(id),
        storage.getThemes(id), 
        storage.getMedia(id),
        storage.getTextGroups(id)
      ]);

      const displayConfig = {
        user: {
          id: user.id,
          username: user.username,
          clinicName: user.clinicName,
          clinicLocation: user.clinicLocation
        },
        settings,
        themes,
        media,
        textGroups,
        stats: {
          totalSettings: settings.length,
          totalThemes: themes.length,
          totalMedia: media.length,
          totalTextGroups: textGroups.length,
          activeTheme: themes.find(t => t.isActive)?.name || "None"
        }
      };

      res.json(displayConfig);
    } catch (error) {
      console.error("Error fetching user display config:", error);
      res.status(500).json({ error: "Failed to fetch display configuration" });
    }
  });

  // Get all windows
  app.get("/api/windows", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const windows = await storage.getWindows(req.session.userId);
      res.json(windows);
    } catch (error) {
      console.error("Error fetching windows:", error);
      res.status(500).json({ error: "Failed to fetch windows" });
    }
  });

  // Create new window
  app.post("/api/windows", async (req, res) => {
    try {
      const { name } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Window name is required" });
      }
      
      // Get user ID from session
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const window = await storage.createWindow({ name, userId });
      res.status(201).json(window);
    } catch (error) {
      console.error("Error creating window:", error);
      res.status(500).json({ error: "Failed to create window" });
    }
  });

  // Update window
  app.put("/api/windows/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { id } = req.params;
      const { name } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Window name is required" });
      }
      
      const window = await storage.updateWindow(id, name, req.session.userId);
      if (!window) {
        return res.status(404).json({ error: "Window not found" });
      }
      
      res.json(window);
    } catch (error) {
      console.error("Error updating window:", error);
      res.status(500).json({ error: "Failed to update window" });
    }
  });

  // Delete window
  app.delete("/api/windows/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { id } = req.params;
      
      const success = await storage.deleteWindow(id, req.session.userId);
      if (!success) {
        return res.status(400).json({ error: "Cannot delete window - window not found or currently occupied" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting window:", error);
      res.status(500).json({ error: "Failed to delete window" });
    }
  });

  // Toggle window status
  app.patch("/api/windows/:id/status", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { id } = req.params;
      
      const window = await storage.toggleWindowStatus(id, req.session.userId);
      if (!window) {
        return res.status(404).json({ error: "Window not found" });
      }
      
      res.json(window);
    } catch (error) {
      console.error("Error toggling window status:", error);
      res.status(500).json({ error: "Failed to toggle window status" });
    }
  });

  // Update window patient assignment
  app.patch("/api/windows/:id/patient", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { id } = req.params;
      const { patientId } = req.body;
      
      const window = await storage.updateWindowPatient(id, patientId, req.session.userId);
      if (!window) {
        return res.status(404).json({ error: "Window not found" });
      }
      
      res.json(window);
    } catch (error) {
      console.error("Error updating window patient:", error);
      res.status(500).json({ error: "Failed to update window patient" });
    }
  });

  // Dashboard routes
  
  // Get dashboard statistics
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const stats = await storage.getDashboardStats(req.session.userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });

  // Get current call (currently called patient)
  app.get("/api/dashboard/current-call", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const currentCall = await storage.getCurrentCall(req.session.userId);
      res.json(currentCall || null);
    } catch (error) {
      console.error("Error fetching current call:", error);
      res.status(500).json({ error: "Failed to fetch current call" });
    }
  });

  // Get recent history (recently completed patients)
  app.get("/api/dashboard/history", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const limit = parseInt(req.query.limit as string) || 10;
      const history = await storage.getRecentHistory(limit, req.session.userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching recent history:", error);
      res.status(500).json({ error: "Failed to fetch recent history" });
    }
  });

  // Settings routes

  // Get all settings
  app.get("/api/settings", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const settings = await storage.getSettings(req.session.userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Get settings by category
  app.get("/api/settings/category/:category", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { category } = req.params;
      const settings = await storage.getSettingsByCategory(category, req.session.userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings by category:", error);
      res.status(500).json({ error: "Failed to fetch settings by category" });
    }
  });

  // Get specific setting
  app.get("/api/settings/:key", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { key } = req.params;
      const setting = await storage.getSetting(key, req.session.userId);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  // Create or update setting
  app.put("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value, category } = req.body;

      if (!value || !category) {
        return res.status(400).json({ error: "Value and category are required" });
      }

      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      // Try to update existing setting first
      let setting = await storage.updateSetting(key, value, req.session.userId);
      
      // If setting doesn't exist, create new one
      if (!setting) {
        setting = await storage.setSetting(key, value, category, req.session.userId);
      }

      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // Update multiple settings
  app.put("/api/settings", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { settings } = req.body;

      if (!settings || !Array.isArray(settings)) {
        return res.status(400).json({ error: "Settings array is required" });
      }

      const updatedSettings = [];
      for (const settingData of settings) {
        const { key, value, category } = settingData;
        if (!key || !value || !category) {
          continue; // Skip invalid settings
        }

        // Try to update existing setting first
        let setting = await storage.updateSetting(key, value, req.session.userId);
        
        // If setting doesn't exist, create new one
        if (!setting) {
          setting = await storage.setSetting(key, value, category, req.session.userId);
        }
        
        updatedSettings.push(setting);
      }

      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating multiple settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Delete setting
  app.delete("/api/settings/:key", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { key } = req.params;
      const deleted = await storage.deleteSetting(key, req.session.userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Setting not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting setting:", error);
      res.status(500).json({ error: "Failed to delete setting" });
    }
  });

  // Media management routes
  
  // Get all media files
  app.get("/api/media", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const media = await storage.getActiveMedia(req.session.userId);
      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  // Get media by ID
  app.get("/api/media/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { id } = req.params;
      const media = await storage.getMediaById(id, req.session.userId);
      
      if (!media) {
        return res.status(404).json({ error: "Media not found" });
      }
      
      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  // Upload media file with actual file handling
  app.post("/api/media/upload", requireAuth, upload.single('file'), async (req, res) => {
    try {
      // Auth already checked by requireAuth middleware
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { name, type } = req.body;
      const file = req.file;

      // Validate file type
      if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
        return res.status(400).json({ error: "Only PNG and JPEG files are allowed" });
      }

      // Generate filename with timestamp to avoid conflicts
      const timestamp = Date.now();
      const extension = file.mimetype === 'image/png' ? 'png' : 'jpg';
      const filename = `${timestamp}_${(name || file.originalname).toLowerCase().replace(/\s+/g, '_').replace(/\.[^/.]+$/, "")}.${extension}`;
      
      // Use object storage path - create relative to workspace
      const PUBLIC_OBJECT_SEARCH_PATHS = process.env.PUBLIC_OBJECT_SEARCH_PATHS;
      let publicPath = 'uploads/public'; // default fallback to local directory
      
      if (PUBLIC_OBJECT_SEARCH_PATHS) {
        try {
          // Try parsing as JSON first
          const paths = JSON.parse(PUBLIC_OBJECT_SEARCH_PATHS);
          if (Array.isArray(paths) && paths.length > 0) {
            // Make relative to current working directory
            publicPath = paths[0].startsWith('/') ? paths[0].substring(1) : paths[0];
          }
        } catch (e) {
          // If not JSON, treat as direct path string
          console.log('Using PUBLIC_OBJECT_SEARCH_PATHS as direct path:', PUBLIC_OBJECT_SEARCH_PATHS);
          // Make relative to current working directory
          publicPath = PUBLIC_OBJECT_SEARCH_PATHS.startsWith('/') ? PUBLIC_OBJECT_SEARCH_PATHS.substring(1) : PUBLIC_OBJECT_SEARCH_PATHS;
        }
      }

      const filePath = path.join(publicPath, filename);
      const url = `/${publicPath}/${filename}`;

      console.log('Uploading file to:', filePath);
      console.log('File URL will be:', url);

      // Ensure directory exists (create recursively)
      await fs.mkdir(publicPath, { recursive: true });

      // Write file to object storage
      await fs.writeFile(filePath, file.buffer);

      // Save to database
      const media = await storage.createMedia({
        name: name || file.originalname,
        filename,
        url,
        type: 'image',
        mimeType: file.mimetype,
        size: file.size,
        userId: req.session.userId,
      });

      res.status(201).json(media);
    } catch (error) {
      console.error("Error uploading media:", error);
      res.status(500).json({ error: "Failed to upload media" });
    }
  });

  // Create new media (for now simulated upload)
  app.post("/api/media", async (req, res) => {
    try {
      // Check authentication FIRST, before any processing
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { name, type } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ error: "Name and type are required" });
      }

      // Simulate file upload data
      const filename = `${name.toLowerCase().replace(/\s+/g, '_')}.${type === 'image' ? 'jpg' : 'mp4'}`;
      const url = `/media/${filename}`;
      const mimeType = type === 'image' ? 'image/jpeg' : 'video/mp4';
      const size = Math.floor(Math.random() * 1000000) + 100000; // Random size between 100KB-1MB

      const media = await storage.createMedia({
        name,
        filename,
        url,
        type: type as 'image' | 'video',
        mimeType,
        size,
        userId: req.session.userId,
      });

      res.status(201).json(media);
    } catch (error) {
      console.error("Error creating media:", error);
      res.status(500).json({ error: "Failed to create media" });
    }
  });

  // Update media (rename)
  app.patch("/api/media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const media = await storage.updateMedia(id, { name });
      
      if (!media) {
        return res.status(404).json({ error: "Media not found" });
      }
      
      res.json(media);
    } catch (error) {
      console.error("Error updating media:", error);
      res.status(500).json({ error: "Failed to update media" });
    }
  });

  // Delete media
  app.delete("/api/media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteMedia(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Media not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting media:", error);
      res.status(500).json({ error: "Failed to delete media" });
    }
  });




  
  // Add test media (for development/testing)
  app.post("/api/media/test", async (req, res) => {
    try {
      const testMedia = [
        {
          name: "Medical Scan Image",
          filename: "scan_image.jpg",
          url: "https://via.placeholder.com/800x600/4f46e5/ffffff?text=Medical+Scan",
          type: 'image' as const,
          mimeType: "image/jpeg",
          size: 145000,
        },
        {
          name: "Clinic Poster",
          filename: "poster.png", 
          url: "https://via.placeholder.com/600x900/10b981/ffffff?text=Clinic+Poster",
          type: 'image' as const,
          mimeType: "image/png",
          size: 230000,
        },
        {
          name: "Health Info Banner",
          filename: "health_banner.jpg",
          url: "https://via.placeholder.com/1200x400/f59e0b/ffffff?text=Health+Information",
          type: 'image' as const,
          mimeType: "image/jpeg", 
          size: 180000,
        },
        {
          name: "Appointment Notice",
          filename: "appointment.png",
          url: "https://via.placeholder.com/400x800/ef4444/ffffff?text=Appointment+Notice",
          type: 'image' as const,
          mimeType: "image/png",
          size: 95000,
        }
      ];

      const createdMedia = [];
      for (const mediaData of testMedia) {
        const media = await storage.createMedia({
          ...mediaData,
          userId: 'system' // Test media for system
        });
        createdMedia.push(media);
      }

      res.json({ 
        success: true, 
        message: `${createdMedia.length} test media items created`,
        media: createdMedia 
      });
    } catch (error) {
      console.error("Error creating test media:", error);
      res.status(500).json({ error: "Failed to create test media" });
    }
  });
  
  // Get active media for display
  app.get("/api/display", async (req, res) => {
    try {
      // Get current settings to determine media type
      const settings = await storage.getSettings();
      const settingsObj = settings.reduce((acc: Record<string, string>, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      const dashboardMediaType = settingsObj.dashboardMediaType || "own";
      const youtubeUrl = settingsObj.youtubeUrl || "";

      // If YouTube is selected and URL is provided, return YouTube media
      if (dashboardMediaType === "youtube" && youtubeUrl) {
        const youtubeMedia = [{
          id: "youtube-video",
          name: "YouTube Video",
          filename: "youtube-video",
          url: youtubeUrl,
          type: "youtube" as const,
          mimeType: "video/youtube",
          size: 0,
          isActive: true,
          uploadedAt: new Date()
        }];
        res.json(youtubeMedia);
      } else {
        // Otherwise return regular uploaded media
        const activeMedia = await storage.getActiveMedia();
        res.json(activeMedia);
      }
    } catch (error) {
      console.error("Error fetching display media:", error);
      res.status(500).json({ error: "Failed to fetch display media" });
    }
  });

  // Save media items to display (mark as active)
  app.post("/api/display", async (req, res) => {
    try {
      const { mediaIds } = req.body;
      
      if (!Array.isArray(mediaIds)) {
        return res.status(400).json({ error: "mediaIds must be an array" });
      }

      // First, deactivate all current media
      const allMedia = await storage.getMedia();
      for (const media of allMedia) {
        if (media.isActive) {
          await storage.updateMedia(media.id, { isActive: false });
        }
      }

      // Then activate the selected media
      const updatedMedia = [];
      for (const mediaId of mediaIds) {
        const updated = await storage.updateMedia(mediaId, { isActive: true });
        if (updated) {
          updatedMedia.push(updated);
        }
      }

      res.json({ 
        success: true, 
        message: `${updatedMedia.length} media items activated for display`,
        activeMedia: updatedMedia 
      });
    } catch (error) {
      console.error("Error saving media to display:", error);
      res.status(500).json({ error: "Failed to save media to display" });
    }
  });

  // Theme management routes
  
  // Text Groups routes
  
  // Get all text groups
  app.get("/api/text-groups", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const textGroups = await storage.getTextGroups(req.session.userId);
      res.json(textGroups);
    } catch (error) {
      console.error("Error fetching text groups:", error);
      res.status(500).json({ error: "Failed to fetch text groups" });
    }
  });

  // Get active text groups
  app.get("/api/text-groups/active", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const activeTextGroups = await storage.getActiveTextGroups(req.session.userId);
      res.json(activeTextGroups);
    } catch (error) {
      console.error("Error fetching active text groups:", error);
      res.status(500).json({ error: "Failed to fetch active text groups" });
    }
  });

  // Get text group by name
  app.get("/api/text-groups/name/:groupName", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { groupName } = req.params;
      const textGroup = await storage.getTextGroupByName(groupName, req.session.userId);
      
      if (!textGroup) {
        return res.status(404).json({ error: "Text group not found" });
      }
      
      res.json(textGroup);
    } catch (error) {
      console.error("Error fetching text group by name:", error);
      res.status(500).json({ error: "Failed to fetch text group" });
    }
  });

  // Get text group by ID
  app.get("/api/text-groups/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { id } = req.params;
      const textGroup = await storage.getTextGroupById(id, req.session.userId);
      
      if (!textGroup) {
        return res.status(404).json({ error: "Text group not found" });
      }
      
      res.json(textGroup);
    } catch (error) {
      console.error("Error fetching text group:", error);
      res.status(500).json({ error: "Failed to fetch text group" });
    }
  });

  // Create new text group
  app.post("/api/text-groups", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const textGroupData = insertTextGroupSchema.parse({ ...req.body, userId: req.session.userId });
      const textGroup = await storage.createTextGroup(textGroupData);
      res.status(201).json(textGroup);
    } catch (error) {
      console.error("Error creating text group:", error);
      res.status(400).json({ error: "Invalid text group data" });
    }
  });

  // Update text group
  app.put("/api/text-groups/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { id } = req.params;
      const updates = req.body;
      
      const textGroup = await storage.updateTextGroup(id, updates, req.session.userId);
      if (!textGroup) {
        return res.status(404).json({ error: "Text group not found" });
      }
      
      res.json(textGroup);
    } catch (error) {
      console.error("Error updating text group:", error);
      res.status(500).json({ error: "Failed to update text group" });
    }
  });

  // Toggle text group status
  app.patch("/api/text-groups/:id/status", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { id } = req.params;
      
      const textGroup = await storage.toggleTextGroupStatus(id, req.session.userId);
      if (!textGroup) {
        return res.status(404).json({ error: "Text group not found" });
      }
      
      res.json(textGroup);
    } catch (error) {
      console.error("Error toggling text group status:", error);
      res.status(500).json({ error: "Failed to toggle text group status" });
    }
  });

  // Delete text group
  app.delete("/api/text-groups/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { id } = req.params;
      const deleted = await storage.deleteTextGroup(id, req.session.userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Text group not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting text group:", error);
      res.status(500).json({ error: "Failed to delete text group" });
    }
  });

  // Theme routes
  
  // Get all themes
  app.get("/api/themes", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const themes = await storage.getThemes(req.session.userId);
      res.json(themes);
    } catch (error) {
      console.error("Error fetching themes:", error);
      res.status(500).json({ error: "Failed to fetch themes" });
    }
  });

  // Get active theme
  app.get("/api/themes/active", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const activeTheme = await storage.getActiveTheme(req.session.userId);
      
      if (!activeTheme) {
        return res.status(404).json({ error: "No active theme found" });
      }
      
      res.json(activeTheme);
    } catch (error) {
      console.error("Error fetching active theme:", error);
      res.status(500).json({ error: "Failed to fetch active theme" });
    }
  });

  // Get theme by ID
  app.get("/api/themes/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const { id } = req.params;
      const theme = await storage.getThemeById(id, req.session.userId);
      
      if (!theme) {
        return res.status(404).json({ error: "Theme not found" });
      }
      
      res.json(theme);
    } catch (error) {
      console.error("Error fetching theme:", error);
      res.status(500).json({ error: "Failed to fetch theme" });
    }
  });

  // Create new theme
  app.post("/api/themes", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const themeData = insertThemeSchema.parse({ ...req.body, userId: req.session.userId });
      const theme = await storage.createTheme(themeData);
      res.status(201).json(theme);
    } catch (error) {
      console.error("Error creating theme:", error);
      res.status(400).json({ error: "Invalid theme data" });
    }
  });

  // Update theme
  app.patch("/api/themes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate theme updates using partial schema
      const updateThemeSchema = insertThemeSchema.partial();
      const updates = updateThemeSchema.parse(req.body);
      
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const theme = await storage.updateTheme(id, updates, req.session.userId);
      
      if (!theme) {
        return res.status(404).json({ error: "Theme not found" });
      }
      
      res.json(theme);
    } catch (error) {
      console.error("Error updating theme:", error);
      res.status(400).json({ error: "Invalid theme data" });
    }
  });

  // Set active theme
  app.patch("/api/themes/:id/activate", async (req, res) => {
    try {
      const { id } = req.params;
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const theme = await storage.setActiveTheme(id, req.session.userId);
      
      if (!theme) {
        return res.status(404).json({ error: "Theme not found" });
      }
      
      res.json(theme);
    } catch (error) {
      console.error("Error activating theme:", error);
      res.status(500).json({ error: "Failed to activate theme" });
    }
  });

  // Delete theme
  app.delete("/api/themes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const deleted = await storage.deleteTheme(id, req.session.userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Theme not found or cannot delete active theme" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting theme:", error);
      res.status(500).json({ error: "Failed to delete theme" });
    }
  });

  // Prayer Times API Routes
  app.get("/api/prayer-times", async (req, res) => {
    try {
      const { city = 'Kuala Lumpur', country = 'Malaysia', latitude, longitude } = req.query;
      
      let apiUrl = 'https://api.aladhan.com/v1/timings';
      let params: Record<string, string> = {
        method: '11' // Singapore method for Malaysia
      };

      // Use coordinates if provided, otherwise use city/country
      if (latitude && longitude) {
        params.latitude = latitude as string;
        params.longitude = longitude as string;
      } else {
        apiUrl = 'https://api.aladhan.com/v1/timingsByCity';
        params.city = city as string;
        params.country = country as string;
      }

      // Construct URL with params
      const searchParams = new URLSearchParams(params);
      const fullUrl = `${apiUrl}?${searchParams.toString()}`;

      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`Prayer times API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== 200) {
        throw new Error('Failed to fetch prayer times');
      }

      // Extract prayer times and format them
      const timings = data.data.timings;
      const prayerTimes = [
        { name: "SUBUH", time: timings.Fajr, key: "fajr" },
        { name: "ZOHOR", time: timings.Dhuhr, key: "dhuhr" },
        { name: "ASAR", time: timings.Asr, key: "asr" },
        { name: "MAGHRIB", time: timings.Maghrib, key: "maghrib" },
        { name: "ISYAK", time: timings.Isha, key: "isha" }
      ];

      // Return prayer times with metadata - let client handle highlighting with browser timezone
      res.json({
        prayerTimes,
        date: data.data.date,
        location: { 
          city: city || 'Unknown', 
          country: country || 'Unknown' 
        },
        meta: {
          timezone: data.data.meta.timezone,
          method: data.data.meta.method.name
        }
      });

    } catch (error) {
      console.error("Error fetching prayer times:", error);
      res.status(500).json({ error: "Failed to fetch prayer times" });
    }
  });

  // Get user's location based on IP (fallback for geolocation)
  app.get("/api/location", async (req, res) => {
    try {
      // Simple IP-based location detection
      const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      
      // For development, default to Malaysia
      if (clientIP === '127.0.0.1' || clientIP === '::1' || !clientIP) {
        return res.json({
          city: 'Kuala Lumpur',
          country: 'Malaysia',
          latitude: 3.1390,
          longitude: 101.6869
        });
      }

      // In production, you could use a service like ipapi.co for IP geolocation
      // For now, default to Malaysia
      res.json({
        city: 'Kuala Lumpur',
        country: 'Malaysia', 
        latitude: 3.1390,
        longitude: 101.6869
      });

    } catch (error) {
      console.error("Error detecting location:", error);
      res.status(500).json({ error: "Failed to detect location" });
    }
  });

  // Get current weather based on location
  app.get("/api/weather", async (req, res) => {
    try {
      const { city = 'Kuala Lumpur', country = 'Malaysia', latitude, longitude } = req.query;
      
      let weatherUrl = 'https://api.openweathermap.org/data/2.5/weather?';
      let params: Record<string, string> = {
        units: 'metric', // Celsius
        lang: 'en'
      };

      // Use coordinates if provided, otherwise use city/country
      if (latitude && longitude) {
        params.lat = latitude as string;
        params.lon = longitude as string;
      } else {
        params.q = `${city},${country}`;
      }

      // Note: OpenWeatherMap requires API key for most endpoints
      // Using a free alternative: Open-Meteo API (no key required)
      if (latitude && longitude) {
        const lat = parseFloat(latitude as string);
        const lon = parseFloat(longitude as string);
        
        const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
        const response = await fetch(openMeteoUrl);
        
        if (!response.ok) {
          throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Map Open-Meteo weather codes to descriptions
        const getWeatherDescription = (code: number) => {
          const weatherCodes: Record<number, { description: string; icon: string }> = {
            0: { description: 'Clear sky', icon: '☀️' },
            1: { description: 'Mainly clear', icon: '🌤️' },
            2: { description: 'Partly cloudy', icon: '⛅' },
            3: { description: 'Overcast', icon: '☁️' },
            45: { description: 'Foggy', icon: '🌫️' },
            48: { description: 'Depositing rime fog', icon: '🌫️' },
            51: { description: 'Light drizzle', icon: '🌦️' },
            53: { description: 'Moderate drizzle', icon: '🌦️' },
            55: { description: 'Dense drizzle', icon: '🌧️' },
            61: { description: 'Slight rain', icon: '🌦️' },
            63: { description: 'Moderate rain', icon: '🌧️' },
            65: { description: 'Heavy rain', icon: '🌧️' },
            80: { description: 'Slight rain showers', icon: '🌦️' },
            81: { description: 'Moderate rain showers', icon: '🌧️' },
            82: { description: 'Violent rain showers', icon: '⛈️' },
            95: { description: 'Thunderstorm', icon: '⛈️' },
            96: { description: 'Thunderstorm with hail', icon: '⛈️' },
            99: { description: 'Thunderstorm with heavy hail', icon: '⛈️' }
          };
          return weatherCodes[code] || { description: 'Unknown', icon: '🌤️' };
        };

        const current = data.current;
        const weather = getWeatherDescription(current.weather_code);
        
        res.json({
          location: {
            city: city || 'Unknown',
            country: country || 'Unknown'
          },
          current: {
            temperature: Math.round(current.temperature_2m),
            humidity: current.relative_humidity_2m,
            windSpeed: current.wind_speed_10m,
            description: weather.description,
            icon: weather.icon
          },
          units: {
            temperature: '°C',
            windSpeed: 'km/h',
            humidity: '%'
          }
        });
        
      } else {
        // Fallback: Return default weather for KL if no coordinates
        res.json({
          location: {
            city: city || 'Kuala Lumpur',
            country: country || 'Malaysia'
          },
          current: {
            temperature: 30,
            humidity: 75,
            windSpeed: 10,
            description: 'Partly cloudy',
            icon: '⛅'
          },
          units: {
            temperature: '°C',
            windSpeed: 'km/h',
            humidity: '%'
          }
        });
      }

    } catch (error) {
      console.error("Error fetching weather:", error);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  // Admin endpoint to get TV token for current user
  app.get("/api/users/me/tv-token", async (req, res) => {
    try {
      // Check authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Sesi tidak aktif" });
      }
      
      const tvToken = storage.generateTvToken(req.session.userId);
      
      res.json({
        tvToken: tvToken,
        tvUrl: `/tv?token=${tvToken}`,
        message: "Token TV untuk paparan klinik anda"
      });
    } catch (error) {
      console.error("Error generating TV token:", error);
      res.status(500).json({ error: "Gagal menjana token TV" });
    }
  });

  // ===== TV DISPLAY TOKEN ROUTES =====
  // These routes serve authenticated TV displays using clinic tokens
  
  // TV Token resolution endpoint - resolve token to userId
  app.get("/api/tv/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const user = await storage.getUserByTvToken(token);
      if (!user) {
        return res.status(404).json({ error: "Token TV tidak sah atau klinik tidak dijumpai" });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ error: "Akaun klinik tidak aktif" });
      }
      
      // Return basic clinic info for TV display
      res.json({
        clinicId: user.id,
        clinicName: user.username,
        isActive: user.isActive,
        token: token
      });
    } catch (error) {
      console.error("Error resolving TV token:", error);
      res.status(500).json({ error: "Gagal menyelesaikan token TV" });
    }
  });
  
  // TV Settings endpoint - get settings for specific clinic token
  app.get("/api/tv/:token/settings", async (req, res) => {
    try {
      const { token } = req.params;
      
      const user = await storage.getUserByTvToken(token);
      if (!user || !user.isActive) {
        return res.status(404).json({ error: "Token TV tidak sah" });
      }
      
      const settings = await storage.getSettings(user.id);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching TV settings:", error);
      res.status(500).json({ error: "Gagal mendapatkan tetapan TV" });
    }
  });
  
  // TV Active Theme endpoint
  app.get("/api/tv/:token/themes/active", async (req, res) => {
    try {
      const { token } = req.params;
      
      const user = await storage.getUserByTvToken(token);
      if (!user || !user.isActive) {
        return res.status(404).json({ error: "Token TV tidak sah" });
      }
      
      const activeTheme = await storage.getActiveTheme(user.id);
      res.json(activeTheme);
    } catch (error) {
      console.error("Error fetching TV active theme:", error);
      res.status(500).json({ error: "Gagal mendapatkan tema aktif TV" });
    }
  });
  
  // TV Active Text Groups endpoint
  app.get("/api/tv/:token/text-groups/active", async (req, res) => {
    try {
      const { token } = req.params;
      
      const user = await storage.getUserByTvToken(token);
      if (!user || !user.isActive) {
        return res.status(404).json({ error: "Token TV tidak sah" });
      }
      
      const activeTextGroups = await storage.getActiveTextGroups(user.id);
      res.json(activeTextGroups);
    } catch (error) {
      console.error("Error fetching TV active text groups:", error);
      res.status(500).json({ error: "Gagal mendapatkan kumpulan teks aktif TV" });
    }
  });
  
  // TV Active Media endpoint
  app.get("/api/tv/:token/media/active", async (req, res) => {
    try {
      const { token } = req.params;
      
      const user = await storage.getUserByTvToken(token);
      if (!user || !user.isActive) {
        return res.status(404).json({ error: "Token TV tidak sah" });
      }
      
      const activeMedia = await storage.getActiveMedia(user.id);
      res.json(activeMedia);
    } catch (error) {
      console.error("Error fetching TV active media:", error);
      res.status(500).json({ error: "Gagal mendapatkan media aktif TV" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
