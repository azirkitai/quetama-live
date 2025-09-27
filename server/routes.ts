import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const { status, windowId } = req.body;
      
      // Clear windowId for completed or requeue status
      const finalWindowId = (status === "completed" || status === "requeue") ? null : windowId;
      
      const patient = await storage.updatePatientStatus(id, status, finalWindowId);
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

  const httpServer = createServer(app);

  return httpServer;
}
