import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // 'admin' or 'user'
  isActive: boolean("is_active").notNull().default(true),
});

// Windows/Rooms table
export const windows = pgTable("windows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  currentPatientId: varchar("current_patient_id"),
});

// Patients/Queue table
export const patients = pgTable("patients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"), // Can be null for number-only patients
  number: integer("number").notNull(),
  status: text("status").notNull().default("waiting"), // 'waiting', 'called', 'in-progress', 'completed', 'requeue'
  windowId: varchar("window_id"),
  registeredAt: timestamp("registered_at").notNull().default(sql`now()`),
  calledAt: timestamp("called_at"),
  completedAt: timestamp("completed_at"),
  requeueReason: text("requeue_reason"), // Reason for requeue: NEBULISER, AMBIL UBATAN, MENUNGGU KEPUTUSAN UJIAN, MGTT
  trackingHistory: text("tracking_history").array().default(sql`'{}'::text[]`), // Array of status changes
});

// Settings table
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  category: text("category").notNull(), // 'display', 'sound', 'general'
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertWindowSchema = createInsertSchema(windows).pick({
  name: true,
});

export const insertPatientSchema = createInsertSchema(patients).pick({
  name: true,
  number: true,
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
  category: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWindow = z.infer<typeof insertWindowSchema>;
export type Window = typeof windows.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
