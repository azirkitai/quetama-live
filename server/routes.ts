import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, insertUserSchema, insertThemeSchema } from "@shared/schema";
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

export async function registerRoutes(app: Express): Promise<Server> {
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
      const patientData = insertPatientSchema.parse(req.body);
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
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      res.status(500).json({ error: "Failed to fetch patients" });
    }
  });

  // Get today's patients
  app.get("/api/patients/today", async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const patients = await storage.getPatientsByDate(today);
      res.json(patients);
    } catch (error) {
      console.error("Error fetching today's patients:", error);
      res.status(500).json({ error: "Failed to fetch today's patients" });
    }
  });

  // Get next patient number
  app.get("/api/patients/next-number", async (req, res) => {
    try {
      const nextNumber = await storage.getNextPatientNumber();
      res.json({ nextNumber });
    } catch (error) {
      console.error("Error getting next patient number:", error);
      res.status(500).json({ error: "Failed to get next patient number" });
    }
  });

  // Update patient status (for queue management)
  app.patch("/api/patients/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, windowId, requeueReason } = req.body;
      
      // Clear windowId for completed or requeue status
      const finalWindowId = (status === "completed" || status === "requeue") ? null : windowId;
      
      const patient = await storage.updatePatientStatus(id, status, finalWindowId, requeueReason);
      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }
      
      // Update window assignment if needed
      if (windowId && status === "called") {
        await storage.updateWindowPatient(windowId, id);
      } else if (status === "completed" || status === "requeue") {
        // Clear patient from window
        const windows = await storage.getWindows();
        const currentWindow = windows.find(w => w.currentPatientId === id);
        if (currentWindow) {
          await storage.updateWindowPatient(currentWindow.id, undefined);
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
      const { id } = req.params;
      const deleted = await storage.deletePatient(id);
      
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
  
  // Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Create new user
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ error: "Invalid user data" });
    }
  });

  // Get specific user
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Update user
  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Toggle user status
  app.patch("/api/users/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await storage.toggleUserStatus(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error toggling user status:", error);
      res.status(500).json({ error: "Failed to toggle user status" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Get all windows
  app.get("/api/windows", async (req, res) => {
    try {
      const windows = await storage.getWindows();
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
      
      const window = await storage.createWindow(name);
      res.status(201).json(window);
    } catch (error) {
      console.error("Error creating window:", error);
      res.status(500).json({ error: "Failed to create window" });
    }
  });

  // Update window
  app.put("/api/windows/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Window name is required" });
      }
      
      const window = await storage.updateWindow(id, name);
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
      const { id } = req.params;
      
      const success = await storage.deleteWindow(id);
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
      const { id } = req.params;
      
      const window = await storage.toggleWindowStatus(id);
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
      const { id } = req.params;
      const { patientId } = req.body;
      
      const window = await storage.updateWindowPatient(id, patientId);
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
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  });

  // Get current call (currently called patient)
  app.get("/api/dashboard/current-call", async (req, res) => {
    try {
      const currentCall = await storage.getCurrentCall();
      res.json(currentCall || null);
    } catch (error) {
      console.error("Error fetching current call:", error);
      res.status(500).json({ error: "Failed to fetch current call" });
    }
  });

  // Get recent history (recently completed patients)
  app.get("/api/dashboard/history", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const history = await storage.getRecentHistory(limit);
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
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Get settings by category
  app.get("/api/settings/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const settings = await storage.getSettingsByCategory(category);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings by category:", error);
      res.status(500).json({ error: "Failed to fetch settings by category" });
    }
  });

  // Get specific setting
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSetting(key);
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

      // Try to update existing setting first
      let setting = await storage.updateSetting(key, value);
      
      // If setting doesn't exist, create new one
      if (!setting) {
        setting = await storage.setSetting(key, value, category);
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
        let setting = await storage.updateSetting(key, value);
        
        // If setting doesn't exist, create new one
        if (!setting) {
          setting = await storage.setSetting(key, value, category);
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
      const { key } = req.params;
      const deleted = await storage.deleteSetting(key);
      
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
      const media = await storage.getActiveMedia();
      res.json(media);
    } catch (error) {
      console.error("Error fetching media:", error);
      res.status(500).json({ error: "Failed to fetch media" });
    }
  });

  // Get media by ID
  app.get("/api/media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const media = await storage.getMediaById(id);
      
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
  app.post("/api/media/upload", upload.single('file'), async (req, res) => {
    try {
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

  // Audio preset routes
  
  // Get available audio presets
  app.get("/api/audio/presets", async (req, res) => {
    try {
      const presets = await storage.getAudioPresets();
      res.json(presets);
    } catch (error) {
      console.error("Error fetching audio presets:", error);
      res.status(500).json({ error: "Failed to fetch audio presets" });
    }
  });

  // Get specific audio preset
  app.get("/api/audio/presets/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const preset = await storage.getAudioPresetByKey(key);
      
      if (!preset) {
        return res.status(404).json({ error: "Audio preset not found" });
      }
      
      res.json(preset);
    } catch (error) {
      console.error("Error fetching audio preset:", error);
      res.status(500).json({ error: "Failed to fetch audio preset" });
    }
  });

  // Serve preset audio files
  app.get("/api/audio/presets/:key.mp3", async (req, res) => {
    try {
      const { key } = req.params;
      
      // For now, return a placeholder response for preset audio files
      // In production, this would serve actual audio files from object storage
      console.warn(`Audio preset ${key} requested but no actual audio file available`);
      
      // Return a 404 for now until actual audio files are uploaded
      res.status(404).json({ 
        error: "Audio preset file not found",
        message: "Preset audio files need to be uploaded to object storage"
      });
    } catch (error) {
      console.error("Error serving audio preset:", error);
      res.status(500).json({ error: "Failed to serve audio preset" });
    }
  });

  // Rate limiting map for TTS endpoint (simple in-memory store)
  const ttsRateLimit = new Map<string, { count: number, resetTime: number }>();
  const TTS_RATE_LIMIT = 10; // Max 10 requests per minute per IP
  const TTS_RATE_WINDOW = 60 * 1000; // 1 minute

  // ElevenLabs TTS API endpoint (support both GET and POST)
  const handleTTSRequest = async (req: any, res: any) => {
    try {
      // Support both GET (query param) and POST (body) methods
      const text = (req.query.text || req.body?.text || '').toString().trim();
      const language = (req.query.language || req.body?.language || 'en').toString().toLowerCase();
      
      if (!text) {
        return res.status(400).json({ error: 'text parameter is required' });
      }

      // Simple rate limiting by IP
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      const clientLimit = ttsRateLimit.get(clientIp);
      
      if (clientLimit) {
        if (now < clientLimit.resetTime) {
          if (clientLimit.count >= TTS_RATE_LIMIT) {
            return res.status(429).json({ 
              error: 'Rate limit exceeded', 
              retryAfter: Math.ceil((clientLimit.resetTime - now) / 1000)
            });
          }
          clientLimit.count++;
        } else {
          // Reset window
          ttsRateLimit.set(clientIp, { count: 1, resetTime: now + TTS_RATE_WINDOW });
        }
      } else {
        ttsRateLimit.set(clientIp, { count: 1, resetTime: now + TTS_RATE_WINDOW });
      }

      // Basic validation - limit text length to prevent abuse
      if (text.length > 500) {
        return res.status(400).json({ error: 'Text too long (max 500 characters)' });
      }

      // Check if ElevenLabs API key is available
      const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
      if (!ELEVEN_API_KEY) {
        console.warn('ElevenLabs API key not found, falling back to browser TTS');
        return res.status(503).json({ 
          error: 'TTS service not configured',
          fallback: true,
          message: 'ElevenLabs API key not found. Configure ELEVEN_API_KEY in secrets.'
        });
      }

      // Fetch voice IDs from database settings (with fallback to environment)
      let voiceId: string;
      let modelId: string;
      
      try {
        if (language === 'ms' || language === 'my' || language === 'bm') {
          // Bahasa Malaysia configuration
          const bmVoiceSetting = await storage.getSetting('elevenVoiceIdBM');
          voiceId = bmVoiceSetting?.value || 
                   process.env.ELEVEN_VOICE_ID_BM || 
                   process.env.ELEVEN_VOICE_ID || 
                   '21m00Tcm4TlvDq8ikWAM';
          modelId = 'eleven_multilingual_v2'; // Better for Malay (multilingual required)
        } else {
          // English configuration  
          const enVoiceSetting = await storage.getSetting('elevenVoiceIdEN');
          voiceId = enVoiceSetting?.value || 
                   process.env.ELEVEN_VOICE_ID_EN || 
                   process.env.ELEVEN_VOICE_ID || 
                   '21m00Tcm4TlvDq8ikWAM';
          modelId = 'eleven_monolingual_v1'; // Better for English
        }
      } catch (error) {
        console.warn('Failed to fetch voice settings from database, using fallback:', error);
        // Fallback to environment variables only
        if (language === 'ms' || language === 'my' || language === 'bm') {
          voiceId = process.env.ELEVEN_VOICE_ID_BM || process.env.ELEVEN_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
          modelId = 'eleven_multilingual_v2';
        } else {
          voiceId = process.env.ELEVEN_VOICE_ID_EN || process.env.ELEVEN_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
          modelId = 'eleven_monolingual_v1';
        }
      }

      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?` +
                  `optimize_streaming_latency=3&output_format=mp3_44100_128`;

      const body = {
        text,
        model_id: modelId, // Use language-specific model
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
          style: 0.3,
          use_speaker_boost: true
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVEN_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('ElevenLabs API error:', response.status, errorText);
        return res.status(500).json({ 
          error: 'TTS API failed',
          detail: errorText,
          fallback: true
        });
      }

      // Set headers for audio streaming
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      // Stream audio directly to client for low latency
      if (response.body) {
        const reader = response.body.getReader();
        const stream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
          } catch (error) {
            console.error('Streaming error:', error);
            res.end();
          }
        };
        await stream();
      } else {
        throw new Error('No response body from ElevenLabs API');
      }

    } catch (error) {
      console.error('TTS endpoint error:', error);
      res.status(500).json({ 
        error: 'Server error',
        detail: String(error),
        fallback: true
      });
    }
  };

  // Register both GET and POST handlers for TTS endpoint
  app.get("/api/tts", handleTTSRequest);
  app.post("/api/tts", handleTTSRequest);

  // Display routes (for TV display management)
  
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
        const media = await storage.createMedia(mediaData);
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
  
  // Get all themes
  app.get("/api/themes", async (req, res) => {
    try {
      const themes = await storage.getThemes();
      res.json(themes);
    } catch (error) {
      console.error("Error fetching themes:", error);
      res.status(500).json({ error: "Failed to fetch themes" });
    }
  });

  // Get active theme
  app.get("/api/themes/active", async (req, res) => {
    try {
      const activeTheme = await storage.getActiveTheme();
      
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
      const { id } = req.params;
      const theme = await storage.getThemeById(id);
      
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
      const themeData = insertThemeSchema.parse(req.body);
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
      
      const theme = await storage.updateTheme(id, updates);
      
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
      const theme = await storage.setActiveTheme(id);
      
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
      const deleted = await storage.deleteTheme(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Theme not found or cannot delete active theme" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting theme:", error);
      res.status(500).json({ error: "Failed to delete theme" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
